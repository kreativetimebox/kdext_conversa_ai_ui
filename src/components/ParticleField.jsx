import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ACCENT_COLORS = [0x7c3aed, 0x8b5cf6, 0x06b6d4, 0x22d3ee, 0xec4899];

// Ambient drifting particle field — a quiet Three.js background layer for
// content-heavy pages (chat, etc). Kept subtle: small points, slow motion,
// low opacity, pointer-events disabled so it never interferes with the UI.
// When `active` is true, `level` (0-1 live mic volume) speeds up the drift
// and brightens the field so it visibly responds while someone is speaking.
export default function ParticleField({ style, count = 260, level = 0, active = false }) {
  const containerRef = useRef(null);
  const levelRef = useRef(0);
  const activeRef = useRef(false);

  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 20);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const palette = ACCENT_COLORS.map((c) => new THREE.Color(c));

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      speeds[i] = 0.05 + Math.random() * 0.15;

      const color = palette[i % palette.length];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const resize = () => {
      const { clientWidth, clientHeight } = container;
      if (!clientWidth || !clientHeight) return;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let rafId;
    const clock = new THREE.Clock();
    let smoothedLevel = 0;

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      smoothedLevel += (levelRef.current - smoothedLevel) * 0.1;
      const boost = activeRef.current ? 1 + smoothedLevel * 5 : 1;

      const posAttr = geometry.attributes.position;
      for (let i = 0; i < count; i++) {
        posAttr.array[i * 3 + 1] += speeds[i] * 0.01 * boost;
        if (posAttr.array[i * 3 + 1] > 4) posAttr.array[i * 3 + 1] = -4;
      }
      posAttr.needsUpdate = true;

      points.rotation.y = elapsed * 0.02 * boost;
      points.rotation.x = Math.sin(elapsed * 0.05) * 0.05;
      material.opacity = activeRef.current ? 0.5 + smoothedLevel * 0.5 : 0.55;
      material.size = activeRef.current ? 0.045 + smoothedLevel * 0.03 : 0.045;

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [count]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        ...style,
      }}
    />
  );
}
