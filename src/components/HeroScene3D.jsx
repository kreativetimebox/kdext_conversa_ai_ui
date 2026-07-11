import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ACCENT_COLORS = [0x7c3aed, 0x8b5cf6, 0x06b6d4, 0x22d3ee];

export default function HeroScene3D() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 6.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Glowing wireframe core — represents the "voice" orb
    const coreGeometry = new THREE.IcosahedronGeometry(1.5, 1);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    rootGroup.add(core);

    // Expanding rings — represent outward voice/sound waves
    const rings = [];
    const ringCount = 4;
    for (let i = 0; i < ringCount; i++) {
      const geometry = new THREE.TorusGeometry(1.6, 0.012, 8, 96);
      const material = new THREE.MeshBasicMaterial({
        color: ACCENT_COLORS[i % ACCENT_COLORS.length],
        transparent: true,
        opacity: 0.8,
      });
      const ring = new THREE.Mesh(geometry, material);
      ring.rotation.x = Math.PI / 2 + (i * 0.35);
      ring.rotation.y = i * 0.6;
      ring.userData.phase = i / ringCount;
      rings.push(ring);
      rootGroup.add(ring);
    }

    // Particle field — floating sound particles around the orb
    const particleCount = 700;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const colorPalette = ACCENT_COLORS.map((c) => new THREE.Color(c));

    for (let i = 0; i < particleCount; i++) {
      const radius = 2.4 + Math.random() * 2.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const color = colorPalette[i % colorPalette.length];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    rootGroup.add(particles);

    // Subtle mouse-follow parallax
    const pointer = { x: 0, y: 0 };
    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    window.addEventListener('pointermove', handlePointerMove);

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

    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      core.rotation.y = elapsed * 0.18;
      core.rotation.x = elapsed * 0.09;

      rings.forEach((ring, i) => {
        const speed = 0.18;
        const progress = ((elapsed * speed + ring.userData.phase) % 1);
        const scale = 1 + progress * 1.6;
        ring.scale.set(scale, scale, scale);
        ring.material.opacity = Math.max(0, 0.85 * (1 - progress));
        ring.rotation.z = elapsed * 0.12 * (i % 2 === 0 ? 1 : -1);
      });

      particles.rotation.y = elapsed * 0.035;
      particles.rotation.x = elapsed * 0.015;

      rootGroup.rotation.y += (pointer.x * 0.4 - rootGroup.rotation.y) * 0.03;
      rootGroup.rotation.x += (-pointer.y * 0.25 - rootGroup.rotation.x) * 0.03;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);

      coreGeometry.dispose();
      coreMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      rings.forEach((ring) => {
        ring.geometry.dispose();
        ring.material.dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} style={styles.container} aria-hidden="true" />;
}

const styles = {
  container: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
    pointerEvents: 'none',
  },
};
