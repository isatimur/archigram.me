'use client';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const VERT = /* glsl */ `
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_pointer;
  attribute float a_size;
  attribute float a_speed;
  attribute float a_phase;
  varying float v_alpha;

  void main() {
    vec3 pos = position;

    // Soft wave motion
    float wave = sin(pos.x * 3.0 + u_time * a_speed + a_phase) * 0.018
               + cos(pos.y * 2.5 + u_time * a_speed * 0.7 + a_phase) * 0.012;
    pos.y += wave;
    pos.x += sin(pos.y * 2.0 + u_time * a_speed * 0.5) * 0.008;

    // Pointer drift — subtle push away
    vec2 toPointer = pos.xy - u_pointer;
    float dist = length(toPointer);
    float push = smoothstep(0.3, 0.0, dist) * 0.06;
    pos.xy += normalize(toPointer + 0.001) * push;

    // Depth fade — edges dissolve
    float edgeDist = min(min(pos.x + 1.0, 1.0 - pos.x), min(pos.y + 1.0, 1.0 - pos.y));
    v_alpha = smoothstep(0.0, 0.15, edgeDist) * 0.55;

    gl_Position = vec4(pos, 1.0);
    gl_PointSize = a_size;
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  varying float v_alpha;

  void main() {
    // Soft circular dot
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float alpha = (1.0 - smoothstep(0.3, 0.5, d)) * v_alpha;
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
  }
`;

const COLS = 40;
const ROWS = 28;
const COUNT = COLS * ROWS;

export default function WebGLParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Build particle grid in NDC [-1, 1]
    const positions = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    const speeds = new Float32Array(COUNT);
    const phases = new Float32Array(COUNT);

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const i = row * COLS + col;
        positions[i * 3 + 0] = (col / (COLS - 1)) * 2 - 1;
        positions[i * 3 + 1] = (row / (ROWS - 1)) * 2 - 1;
        positions[i * 3 + 2] = 0;
        sizes[i] = 1.2 + Math.random() * 1.2;
        speeds[i] = 0.3 + Math.random() * 0.5;
        phases[i] = Math.random() * Math.PI * 2;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('a_size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('a_speed', new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute('a_phase', new THREE.BufferAttribute(phases, 1));

    const uniforms = {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2() },
      u_pointer: { value: new THREE.Vector2(9999, 9999) },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      transparent: true,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      uniforms.u_resolution.value.set(w, h);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onPointer = (e: globalThis.PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      uniforms.u_pointer.value.set(x, y);
    };
    canvas.parentElement?.addEventListener('pointermove', onPointer);

    let rafId: number;
    const startedAt = Date.now();
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      uniforms.u_time.value = (Date.now() - startedAt) / 1000;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      canvas.parentElement?.removeEventListener('pointermove', onPointer);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden
    />
  );
}
