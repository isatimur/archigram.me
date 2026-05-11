/**
 * Shared GitHub helpers wrapping @octokit/rest.
 *
 * Exposes a singleton client, a retry-aware paginator for code search, and a
 * raw-file fetcher. All callers go through here so we have one place to handle
 * secondary rate limits and License API quirks.
 */

import { Octokit } from '@octokit/rest';
import { sleep } from './util';

let cached: Octokit | null = null;

export function getOctokit(): Octokit {
  if (cached) return cached;
  const token = process.env.GITHUB_TOKEN;
  cached = new Octokit({
    auth: token,
    userAgent: 'archigram-ingest/1.0',
    // Octokit's defaults already retry on 5xx and 403 rate-limit responses.
  });
  return cached;
}

export type CodeSearchItem = {
  htmlUrl: string;
  path: string;
  repoFullName: string;
  defaultRef: string;
};

/**
 * Run a GitHub code search query, returning up to `limit` items. Sleeps on
 * secondary rate limits. The "sort by indexed" option is GitHub's only useful
 * proxy for freshness on code search.
 */
export async function searchCode(query: string, limit: number): Promise<CodeSearchItem[]> {
  const octokit = getOctokit();
  const perPage = 100;
  const results: CodeSearchItem[] = [];

  const MAX_RETRIES_PER_PAGE = 3;
  for (let page = 1; results.length < limit && page <= 10; page++) {
    let pageRetries = 0;
    while (true) {
      try {
        const res = await octokit.search.code({
          q: query,
          sort: 'indexed',
          order: 'desc',
          per_page: perPage,
          page,
        });
        const items = res.data.items;
        if (!items || items.length === 0) return results.slice(0, limit);
        for (const it of items) {
          results.push({
            htmlUrl: it.html_url,
            path: it.path,
            repoFullName: it.repository.full_name,
            defaultRef: 'HEAD',
          });
          if (results.length >= limit) return results.slice(0, limit);
        }
        if (items.length < perPage) return results.slice(0, limit);
        break;
      } catch (err) {
        const e = err as { status?: number; message?: string };
        if ((e.status === 403 || e.status === 429) && pageRetries < MAX_RETRIES_PER_PAGE) {
          pageRetries++;
          console.warn(
            `[github] code search got ${e.status} on page ${page} (attempt ${pageRetries}/${MAX_RETRIES_PER_PAGE}), sleeping 30s…`
          );
          await sleep(30_000);
          continue;
        }
        console.warn(
          `[github] code search failed on page ${page} after ${pageRetries} retries: status=${e.status} message=${e.message ?? err}; ending search`
        );
        return results.slice(0, limit);
      }
    }
  }

  return results.slice(0, limit);
}

export type RepoInfo = {
  fullName: string;
  stars: number;
  licenseSpdx?: string;
  defaultBranch: string;
};

const repoCache = new Map<string, RepoInfo>();

export async function getRepoInfo(fullName: string, attempt = 0): Promise<RepoInfo | null> {
  if (repoCache.has(fullName)) return repoCache.get(fullName) ?? null;
  const octokit = getOctokit();
  const [owner, repo] = fullName.split('/');
  if (!owner || !repo) return null;
  try {
    const res = await octokit.repos.get({ owner, repo });
    const info: RepoInfo = {
      fullName,
      stars: res.data.stargazers_count ?? 0,
      licenseSpdx: res.data.license?.spdx_id ?? undefined,
      defaultBranch: res.data.default_branch ?? 'main',
    };
    repoCache.set(fullName, info);
    return info;
  } catch (err) {
    const e = err as { status?: number; message?: string };
    const MAX_REPO_RETRIES = 2;
    if ((e.status === 403 || e.status === 429) && attempt < MAX_REPO_RETRIES) {
      console.warn(
        `[github] repo lookup got ${e.status} for ${fullName} (attempt ${attempt + 1}/${MAX_REPO_RETRIES}), sleeping 30s…`
      );
      await sleep(30_000);
      return getRepoInfo(fullName, attempt + 1);
    }
    console.warn(
      `[github] repo lookup failed for ${fullName} (status=${e.status}, message=${e.message ?? err}); skipping`
    );
    return null;
  }
}

/**
 * Fetch raw file content for a path on a repo. Falls back to the html_url's
 * blob URL pattern via the `defaultRef`.
 */
export async function fetchRawFile(
  repoFullName: string,
  path: string,
  ref: string
): Promise<string | null> {
  const url = `https://raw.githubusercontent.com/${repoFullName}/${ref}/${path}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'archigram-ingest/1.0',
        Authorization: process.env.GITHUB_TOKEN ? `Bearer ${process.env.GITHUB_TOKEN}` : '',
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}
