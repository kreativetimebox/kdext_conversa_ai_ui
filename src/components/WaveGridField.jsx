import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// A receding wireframe "ocean" grid — distinct from the floating-particle
// background used elsewhere. Vertices ripple with layered sine waves; while
// `active` is true, `level` (0-1 live mic/translation volume) raises the
// wave amplitude and brightens the lines so it visibly reacts to speech.
export default function WaveGridField({ style, level = 0, active = false }) {
  const containerRef = useRef(null);
  const levelRef = useRef(0);
  const activeRef = useRef(false);

  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 30);
    camera.position.set(0, 2.4, 4.6);
    camera.lookAt(0, -0.2, -2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const segments = 44;
    const size = 14;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2.3);
    geometry.translate(0, -0.6, -3);

    const basePositions = geometry.attributes.position.array.slice();

    const colorA = new THREE.Color(0x7c3aed);
    const colorB = new THREE.Color(0x06b6d4);
    const material = new THREE.MeshBasicMaterial({
      color: colorA,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const grid = new THREE.Mesh(geometry, material);
    scene.add(grid);

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
      smoothedLevel += (levelRef.current - smoothedLevel) * 0.12;
      const amp = 0.18 + (activeRef.current ? smoothedLevel * 1.4 : 0);

      const posAttr = geometry.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const bx = basePositions[i * 3];
        const bz = basePositions[i * 3 + 2];
        const wave =
          Math.sin(bx * 0.6 + elapsed * 1.1) * amp +
          Math.cos(bz * 0.5 + elapsed * 0.8) * amp * 0.6;
        posAttr.array[i * 3 + 1] = basePositions[i * 3 + 1] + wave;
      }
      posAttr.needsUpdate = true;

      material.color.copy(colorA).lerp(colorB, (Math.sin(elapsed * 0.3) + 1) / 2);
      material.opacity = activeRef.current ? 0.28 + smoothedLevel * 0.45 : 0.22 + Math.sin(elapsed * 0.4) * 0.04;

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
  }, []);

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
