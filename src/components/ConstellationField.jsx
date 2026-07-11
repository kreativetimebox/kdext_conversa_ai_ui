import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ACCENT_COLORS = [0x7c3aed, 0x06b6d4, 0xec4899];

// Slowly drifting nodes connected by faint lines when close together — a
// quiet "network" ambient background for non-audio pages (Dashboard,
// History, Profile, Settings). No mic reactivity; purely decorative.
export default function ConstellationField({ style, count = 70 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 20);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const nodePositions = [];
    const nodeVelocities = [];
    const pointPositions = new Float32Array(count * 3);
    const pointColors = new Float32Array(count * 3);
    const palette = ACCENT_COLORS.map((c) => new THREE.Color(c));

    for (let i = 0; i < count; i++) {
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 11,
        (Math.random() - 0.5) * 7,
        (Math.random() - 0.5) * 5
      );
      nodePositions.push(pos);
      nodeVelocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.06,
        (Math.random() - 0.5) * 0.06,
        (Math.random() - 0.5) * 0.03
      ));
      pointPositions[i * 3] = pos.x;
      pointPositions[i * 3 + 1] = pos.y;
      pointPositions[i * 3 + 2] = pos.z;

      const color = palette[i % palette.length];
      pointColors[i * 3] = color.r;
      pointColors[i * 3 + 1] = color.g;
      pointColors[i * 3 + 2] = color.b;
    }

    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3));
    pointGeometry.setAttribute('color', new THREE.BufferAttribute(pointColors, 3));
    const pointMaterial = new THREE.PointsMaterial({
      size: 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(pointGeometry, pointMaterial);
    scene.add(points);

    // Line segments are re-built each frame from whichever pairs are
    // currently close enough — capped so the buffer size stays fixed.
    const MAX_LINES = 160;
    const linePositions = new Float32Array(MAX_LINES * 2 * 3);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setDrawRange(0, 0);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    const CONNECT_DIST = 2.3;

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

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      const posAttr = pointGeometry.attributes.position;

      for (let i = 0; i < count; i++) {
        const p = nodePositions[i];
        const v = nodeVelocities[i];
        p.add(v);
        if (p.x > 6 || p.x < -6) v.x *= -1;
        if (p.y > 4 || p.y < -4) v.y *= -1;
        if (p.z > 3 || p.z < -3) v.z *= -1;
        posAttr.array[i * 3] = p.x;
        posAttr.array[i * 3 + 1] = p.y;
        posAttr.array[i * 3 + 2] = p.z;
      }
      posAttr.needsUpdate = true;

      let lineCount = 0;
      outer: for (let i = 0; i < count && lineCount < MAX_LINES; i++) {
        for (let j = i + 1; j < count; j++) {
          if (lineCount >= MAX_LINES) break outer;
          const d = nodePositions[i].distanceTo(nodePositions[j]);
          if (d < CONNECT_DIST) {
            const base = lineCount * 6;
            linePositions[base] = nodePositions[i].x;
            linePositions[base + 1] = nodePositions[i].y;
            linePositions[base + 2] = nodePositions[i].z;
            linePositions[base + 3] = nodePositions[j].x;
            linePositions[base + 4] = nodePositions[j].y;
            linePositions[base + 5] = nodePositions[j].z;
            lineCount++;
          }
        }
      }
      lineGeometry.attributes.position.needsUpdate = true;
      lineGeometry.setDrawRange(0, lineCount * 2);

      points.rotation.y = elapsed * 0.015;
      lines.rotation.y = elapsed * 0.015;

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      pointGeometry.dispose();
      pointMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
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
