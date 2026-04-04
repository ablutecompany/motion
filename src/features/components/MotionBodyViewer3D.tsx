import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Image } from 'react-native';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useMotionTheme } from '../../theme/useMotionTheme';
import { BodyMap3DViewModel, BodyRegion3D } from '../../services/motionBodyMap3DService';
import { User } from 'lucide-react';

interface MotionBodyViewer3DProps {
  gender: string;
  visualState: 'preview' | 'data-light' | 'full';
  universe: any;
  model3D: BodyMap3DViewModel;
}

export const MotionBodyViewer3D = ({ gender, visualState, universe, model3D }: MotionBodyViewer3DProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const theme = useMotionTheme();
  
  // Real 3D initialization inside isolated web environment
  useEffect(() => {
    if (Platform.OS !== 'web' || !mountRef.current) return;

    // SCENE SETUP
    const scene = new THREE.Scene();
    
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 5.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI / 3;
    controls.maxPolarAngle = Math.PI / 1.5;
    controls.target.set(0, 1, 0);

    // LIGHTING (Premium Cinematic)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 2);
    rimLight.position.set(-5, 5, -5);
    scene.add(rimLight);

    // MATERIAL (Silicone Abstract Sculptural)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: theme.colors.surfaceHigh,
      roughness: 0.6,
      metalness: 0.1,
    });

    // PARAMETRIC HUMAN SCULPTURE 
    // Adapts intelligently and elegantly based on gender
    const isFemale = gender === 'female';
    const isMale = gender === 'male';
    
    // Proportions
    const shoulderW = isFemale ? 0.35 : isMale ? 0.48 : 0.42;
    const hipW = isFemale ? 0.42 : isMale ? 0.32 : 0.38;
    const torsoScale = isFemale ? 0.8 : isMale ? 1.0 : 0.9;
    const bodyY = 0.5;

    const bodyGroup = new THREE.Group();
    bodyGroup.position.set(0, bodyY, 0);

    // Geometry Helpers
    const createMesh = (geo: THREE.BufferGeometry, posY: number, scaleX = 1, scaleY = 1, scaleZ = 1) => {
      const mesh = new THREE.Mesh(geo, bodyMaterial);
      mesh.position.y = posY;
      mesh.scale.set(scaleX, scaleY, scaleZ);
      return mesh;
    };

    // 1. Head
    const head = createMesh(new THREE.SphereGeometry(0.2, 32, 32), 1.9, 0.8, 1, 0.9);
    bodyGroup.add(head);

    // 2. Neck
    const neckGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.2, 16);
    const neck = createMesh(neckGeo, 1.65);
    bodyGroup.add(neck);

    // 3. Torso (Upper Chest)
    const chestGeo = new THREE.CapsuleGeometry(0.25, 0.4, 16, 32);
    const chest = createMesh(chestGeo, 1.3, shoulderW * 2.5, torsoScale, 0.8);
    // Rotate capsule horizontally for shoulders
    chest.rotation.z = Math.PI / 2;
    bodyGroup.add(chest);

    // 4. Core (Abdomen)
    const coreGeo = new THREE.CapsuleGeometry(0.22, 0.3, 16, 32);
    const core = createMesh(coreGeo, 0.95, 1.1, torsoScale, 0.8);
    bodyGroup.add(core);

    // 5. Pelvis
    const pelvisGeo = new THREE.CapsuleGeometry(0.25, 0.2, 16, 32);
    const pelvis = createMesh(pelvisGeo, 0.6, hipW * 2.5, 1, 0.9);
    pelvis.rotation.z = Math.PI / 2;
    bodyGroup.add(pelvis);

    // 6. Arms
    const armGeo = new THREE.CapsuleGeometry(0.08, 0.5, 16, 16);
    const leftArm = createMesh(armGeo, 1.0, 1, 1, 1);
    leftArm.position.x = -shoulderW - 0.1;
    leftArm.rotation.z = -0.15;
    bodyGroup.add(leftArm);
    
    const rightArm = createMesh(armGeo, 1.0, 1, 1, 1);
    rightArm.position.x = shoulderW + 0.1;
    rightArm.rotation.z = 0.15;
    bodyGroup.add(rightArm);

    // 7. Thighs
    const thighGeo = new THREE.CapsuleGeometry(0.12, 0.6, 16, 16);
    const leftThigh = createMesh(thighGeo, 0.1, 1, 1, 1);
    leftThigh.position.x = -0.18;
    bodyGroup.add(leftThigh);

    const rightThigh = createMesh(thighGeo, 0.1, 1, 1, 1);
    rightThigh.position.x = 0.18;
    bodyGroup.add(rightThigh);

    scene.add(bodyGroup);

    // HIGHLIGHTS (Aura Glow Hotspots scaled by training volume weight)
    const activeDict = Object.fromEntries(model3D.activeRegions.map(r => [r.id, r.weight]));

    const addGlow = (y: number, z: number, weight: number) => {
      // Glow intensity is relative to maximum volume found in interval
      const glow = new THREE.PointLight(theme.colors.primary, 3 * weight, 1.5 + (weight * 0.5));
      glow.position.set(0, y, z);
      bodyGroup.add(glow);

      // Subtle indicator mesh opacity scales with weight
      const indicatorGeo = new THREE.SphereGeometry(0.05 + (weight * 0.02), 16, 16);
      const indicatorMat = new THREE.MeshBasicMaterial({ color: theme.colors.primary, transparent: true, opacity: 0.8 * weight });
      const indicator = new THREE.Mesh(indicatorGeo, indicatorMat);
      indicator.position.set(0, y, z);
      bodyGroup.add(indicator);
    };

    if (activeDict['upper-front']) addGlow(1.3, 0.25, activeDict['upper-front']);
    if (activeDict['upper-back']) addGlow(1.3, -0.25, activeDict['upper-back']);
    if (activeDict['core']) addGlow(0.95, 0.25, activeDict['core']);
    if (activeDict['lower-front']) addGlow(0.1, 0.2, activeDict['lower-front']);
    if (activeDict['lower-back']) addGlow(0.1, -0.2, activeDict['lower-back']);
    if (activeDict['systemic']) {
      addGlow(1.3, 0, activeDict['systemic']); 
      addGlow(0.9, 0, activeDict['systemic']); 
      addGlow(0.1, 0, activeDict['systemic']);
    }

    // RENDER LOOP
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // CLEANUP
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      bodyMaterial.dispose();
      // Dispose geometries
      [head, neck, chest, core, pelvis, leftArm, rightArm, leftThigh, rightThigh].forEach(m => m.geometry.dispose());
    };
  }, [gender, visualState, model3D]);

  // FALLBACK for native/not-web environments
  if (Platform.OS !== 'web') {
    const activeDict = Object.fromEntries(model3D.activeRegions.map(r => [r.id, r.weight]));
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surfaceLow }]}>
        <User size={120} color={theme.colors.surfaceHigh} strokeWidth={1} style={{ opacity: 0.3 }} />
        {/* Fallback glow matches generic zones with opacity scaling */}
        {activeDict['core'] && <View style={[styles.staticGlow, { backgroundColor: theme.colors.primary, bottom: '40%', opacity: 0.5 * activeDict['core'] }]} />}
        {activeDict['upper-front'] && <View style={[styles.staticGlow, { backgroundColor: theme.colors.primary, top: '30%', opacity: 0.5 * activeDict['upper-front'] }]} />}
      </View>
    );
  }

  // PURE WEBGL 3D INTERACTIVE VIEWER 
  return (
    <View style={styles.container}>
      <div 
        ref={mountRef} 
        style={{ width: '100%', height: '100%', outline: 'none', cursor: 'grab' }} 
        onMouseDown={(e: any) => e.currentTarget.style.cursor = 'grabbing'}
        onMouseUp={(e: any) => e.currentTarget.style.cursor = 'grab'}
        onMouseLeave={(e: any) => e.currentTarget.style.cursor = 'grab'}
        title="Rodar corpo"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 320, // Expanded height for better 3D visualization
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center'
  }
});
