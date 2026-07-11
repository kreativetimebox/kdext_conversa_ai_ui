import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Cheap value-noise + fresnel rim shader — approximates the "Siri orb": a
// glossy sphere with organic, colorful blobs swirling inside and a bright
// hot core, reacting to live mic volume via uLevel.
const VERTEX_SHADER = `
  uniform float uTime;
  uniform float uLevel;
  varying vec3 vNormal;
  varying vec3 vPosition;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
  }

  float vnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = hash(i);
    float n100 = hash(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash(i + vec3(1.0, 1.0, 1.0));
    return mix(
      mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
      mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
      f.z
    );
  }

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec3 pos = position;
    float n = vnoise(pos * 2.2 + uTime * 0.35);
    float displacement = (0.06 + uLevel * 0.4) * n;
    pos += normal * displacement;
    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uLevel;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 2.0);

    vec3 colorA = vec3(0.95, 0.15, 0.35);
    vec3 colorB = vec3(0.15, 0.55, 0.98);
    vec3 colorC = vec3(0.2, 0.9, 0.75);

    float mixFactor1 = sin(vPosition.x * 2.4 + uTime * 0.6) * 0.5 + 0.5;
    float mixFactor2 = cos(vPosition.y * 2.4 + uTime * 0.5) * 0.5 + 0.5;

    vec3 color = mix(colorA, colorB, mixFactor1);
    color = mix(color, colorC, mixFactor2);

    float core = smoothstep(0.7, 0.0, length(vPosition.xy)) * (0.5 + uLevel * 0.8);
    color += vec3(1.0) * core;
    color += fresnel * (0.45 + uLevel * 0.5);

    gl_FragColor = vec4(color, 0.95);
  }
`;

// Saturn-like rings around the orb — tilted torus meshes, each spinning at
// its own speed and brightening/quickening with mic volume.
const RING_CONFIGS = [
  { radius: 1.35, tube: 0.048, tiltX: Math.PI / 2.05, tiltZ: 0.1, color: 0x7c3aed, speed: 0.26 },
  { radius: 1.55, tube: 0.044, tiltX: Math.PI / 2.15, tiltZ: 0.18, color: 0x8b5cf6, speed: 0.22 },
  { radius: 1.78, tube: 0.038, tiltX: Math.PI / 2.35, tiltZ: -0.28, color: 0x22d3ee, speed: -0.16 },
  { radius: 2.0, tube: 0.032, tiltX: Math.PI / 2.6, tiltZ: 0.35, color: 0xec4899, speed: 0.12 },
  { radius: 2.22, tube: 0.026, tiltX: Math.PI / 2.8, tiltZ: -0.42, color: 0x06b6d4, speed: -0.09 },
];

export default function SiriOrb({ size = 96, level = 0, active = false, style }) {
  const containerRef = useRef(null);
  const levelRef = useRef(0);
  const activeRef = useRef(false);

  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 20);
    // Pulled back far enough that the outermost ring (radius ~2.15) stays
    // fully in frame with some padding, unlike the orb-only framing before.
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.IcosahedronGeometry(1, 24);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uLevel: { value: 0 },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
    });
    const orb = new THREE.Mesh(geometry, material);
    scene.add(orb);

    const coreGeometry = new THREE.SphereGeometry(0.35, 24, 24);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    const rings = RING_CONFIGS.map((cfg) => {
      const ringGeometry = new THREE.TorusGeometry(cfg.radius, cfg.tube, 8, 96);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(ringGeometry, ringMaterial);
      mesh.rotation.x = cfg.tiltX;
      mesh.rotation.z = cfg.tiltZ;
      scene.add(mesh);
      return { mesh, geometry: ringGeometry, material: ringMaterial, ...cfg };
    });

    let rafId;
    const clock = new THREE.Clock();
    let smoothedLevel = 0;

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      // Smooth the raw mic level so the orb reacts fluidly instead of jittering.
      smoothedLevel += (levelRef.current - smoothedLevel) * 0.15;

      material.uniforms.uTime.value = elapsed;
      material.uniforms.uLevel.value = activeRef.current ? smoothedLevel : 0.08 + Math.sin(elapsed * 0.8) * 0.04;

      const spinSpeed = activeRef.current ? 0.25 + smoothedLevel * 0.6 : 0.12;
      orb.rotation.y = elapsed * spinSpeed;
      orb.rotation.x = Math.sin(elapsed * 0.2) * 0.3;

      const coreScale = activeRef.current ? 0.8 + smoothedLevel * 1.4 : 0.75 + Math.sin(elapsed * 1.2) * 0.08;
      core.scale.setScalar(coreScale);

      rings.forEach((ring, i) => {
        const speedBoost = activeRef.current ? 1 + smoothedLevel * 3 : 1;
        ring.mesh.rotation.y = elapsed * ring.speed * speedBoost;
        ring.material.opacity = activeRef.current
          ? 0.55 + smoothedLevel * 0.45
          : 0.4 + Math.sin(elapsed * 0.6 + i * 2) * 0.1;
        const pulse = activeRef.current ? 1 + smoothedLevel * 0.12 * (i + 1) : 1;
        ring.mesh.scale.setScalar(pulse);
      });

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      geometry.dispose();
      material.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      rings.forEach((ring) => {
        ring.geometry.dispose();
        ring.material.dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [size]);

  return (
    <div
      ref={containerRef}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
