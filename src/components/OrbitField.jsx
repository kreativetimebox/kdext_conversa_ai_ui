import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const RING_CONFIGS = [
  { radius: 2.6, count: 30, speed: 0.18, tilt: 0.25, color: 0x7c3aed },
  { radius: 3.6, count: 42, speed: -0.13, tilt: -0.35, color: 0x06b6d4 },
  { radius: 4.6, count: 54, speed: 0.09, tilt: 0.45, color: 0xec4899 },
];

// Orbiting particle rings around a faint central core — an "atom" style
// ambient background, distinct from the floating particles / wave grid used
// elsewhere. While `active` is true, `level` (0-1 live mic volume) speeds up
// every ring's orbit and brightens them, so it visibly reacts to speech.
export default function OrbitField({ style, level = 0, active = false }) {
  const containerRef = useRef(null);
  const levelRef = useRef(0);
  const activeRef = useRef(false);

  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 30);
    camera.position.z = 9;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const coreGeometry = new THREE.SphereGeometry(0.5, 20, 20);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    const rings = RING_CONFIGS.map((cfg) => {
      const positions = new Float32Array(cfg.count * 3);
      const phases = new Float32Array(cfg.count);
      for (let i = 0; i < cfg.count; i++) {
        phases[i] = (i / cfg.count) * Math.PI * 2;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({
        color: cfg.color,
        size: 0.08,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const points = new THREE.Points(geometry, material);
      points.rotation.x = cfg.tilt;
      scene.add(points);

      const ringGeometry = new THREE.TorusGeometry(cfg.radius, 0.006, 6, 80);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ringPath = new THREE.Mesh(ringGeometry, ringMaterial);
      ringPath.rotation.x = Math.PI / 2 + cfg.tilt;
      scene.add(ringPath);

      return { points, material, phases, ringPath, ringMaterial, ...cfg };
    });

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
      const boost = activeRef.current ? 1 + smoothedLevel * 3 : 1;

      core.scale.setScalar(1 + (activeRef.current ? smoothedLevel * 0.8 : Math.sin(elapsed * 0.6) * 0.08));

      rings.forEach((ring) => {
        const posAttr = ring.points.geometry.attributes.position;
        for (let i = 0; i < ring.count; i++) {
          const angle = ring.phases[i] + elapsed * ring.speed * boost;
          posAttr.array[i * 3] = Math.cos(angle) * ring.radius;
          posAttr.array[i * 3 + 2] = Math.sin(angle) * ring.radius;
          posAttr.array[i * 3 + 1] = Math.sin(angle * 2 + elapsed) * 0.15;
        }
        posAttr.needsUpdate = true;
        ring.material.opacity = activeRef.current ? 0.45 + smoothedLevel * 0.55 : 0.5 + Math.sin(elapsed * 0.5) * 0.1;
        ring.ringMaterial.opacity = activeRef.current ? 0.12 + smoothedLevel * 0.3 : 0.15;
      });

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      coreGeometry.dispose();
      coreMaterial.dispose();
      rings.forEach((ring) => {
        ring.points.geometry.dispose();
        ring.material.dispose();
        ring.ringPath.geometry.dispose();
        ring.ringMaterial.dispose();
      });
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
