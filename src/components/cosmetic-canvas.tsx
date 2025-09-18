
"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import type { CustomizationState } from "@/components/customization-panel";
import { materials, type MaterialKey } from "@/lib/materials";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

type CosmeticCanvasProps = CustomizationState;

const CosmeticCanvas: React.FC<CosmeticCanvasProps> = ({
  colors,
  materials: materialKeys,
  background,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const environmentRef = useRef<THREE.Texture | null>(null);


  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45, // fov
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1, 3); // position
    camera.lookAt(0, 1, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    currentMount.appendChild(renderer.domElement);
    
    // Environment
    const environment = new RoomEnvironment( renderer );
    const pmremGenerator = new THREE.PMREMGenerator( renderer );
    const envTexture = pmremGenerator.fromScene( environment ).texture;
    environmentRef.current = envTexture;
    environment.dispose();

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.target.set(0, 1, 0);
    controls.update();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(5, 5, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.radius = 8;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-5, 3, -2);
    scene.add(fillLight);

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.ShadowMaterial({ opacity: 0.2 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Materials
    const createMaterial = (key: MaterialKey) => {
        const props = materials[key];
        return new THREE.MeshStandardMaterial(props);
    };

    const capMaterial = createMaterial(materialKeys.cap);
    const bodyMaterial = createMaterial(materialKeys.body);
    const pumpMaterial = createMaterial(materialKeys.pump);

    // Bottle Parts
    const bottleGroup = new THREE.Group();
    scene.add(bottleGroup);

    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.8, 0.8, 2, 64);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.name = "body";
    body.castShadow = true;
    body.position.y = 1;
    bottleGroup.add(body);

    // Cap
    const capGeometry = new THREE.CylinderGeometry(0.85, 0.85, 0.4, 64);
    const cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.name = "cap";
    cap.castShadow = true;
    cap.position.y = 2.2;
    bottleGroup.add(cap);

    // Pump
    const pumpGroup = new THREE.Group();
    pumpGroup.name = "pump";
    const pumpBaseGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32);
    const pumpBase = new THREE.Mesh(pumpBaseGeo, pumpMaterial);
    pumpBase.position.y = 2.15;
    
    const pumpNozzleGeo = new THREE.BoxGeometry(0.2, 0.2, 0.6);
    const pumpNozzle = new THREE.Mesh(pumpNozzleGeo, pumpMaterial);
    pumpNozzle.position.set(0, 2.3, 0.3);

    pumpGroup.add(pumpBase);
    pumpGroup.add(pumpNozzle);
    pumpGroup.children.forEach(child => {
        child.castShadow = true;
    });
    bottleGroup.add(pumpGroup);


    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!currentMount) return;
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (renderer.domElement.parentNode === currentMount) {
        currentMount.removeChild(renderer.domElement);
      }
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      if(environmentRef.current) {
        environmentRef.current.dispose();
      }
      renderer.dispose();
      controls.dispose();
      rendererRef.current = null;
      sceneRef.current = null;
    };
  }, []); // Run only once on mount

  // Effect to update colors, materials, and background
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    
    if (background) {
      scene.background = new THREE.Color(background);
      scene.environment = null;
    } else if (environmentRef.current) {
      scene.background = null;
      scene.environment = environmentRef.current;
    }


    const cap = scene.getObjectByName("cap") as THREE.Mesh;
    if (cap && cap.material instanceof THREE.MeshStandardMaterial) {
        cap.material.color.set(colors.cap);
        const props = materials[materialKeys.cap];
        Object.assign(cap.material, props);
        cap.material.needsUpdate = true;
    }

    const body = scene.getObjectByName("body") as THREE.Mesh;
    if (body && body.material instanceof THREE.MeshStandardMaterial) {
        body.material.color.set(colors.body);
        const props = materials[materialKeys.body];
        Object.assign(body.material, props);
        body.material.needsUpdate = true;
    }

    const pumpGroup = scene.getObjectByName("pump") as THREE.Group;
    if (pumpGroup) {
        pumpGroup.children.forEach(child => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                child.material.color.set(colors.pump);
                const props = materials[materialKeys.pump];
                Object.assign(child.material, props);
                child.material.needsUpdate = true;
            }
        });
    }
  }, [colors, materialKeys, background]);


  return <div ref={mountRef} className="w-full h-full" />;
};

export default CosmeticCanvas;
