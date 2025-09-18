
"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import type { CustomizationState } from "@/components/customization-panel";
import { materials, type MaterialKey } from "@/lib/materials";

type CosmeticCanvasProps = Omit<CustomizationState, "brightness">;

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
      27, // fov
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1, 8); // position
    camera.lookAt(0, 1, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    currentMount.appendChild(renderer.domElement);
    
    // Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    new RGBELoader()
      .setPath('/hdr/')
      .load('soft_studio.hdr', (texture) => {
        environmentRef.current = pmremGenerator.fromEquirectangular(texture).texture;
        if (!background) {
            scene.environment = environmentRef.current;
        } else {
            scene.background = new THREE.Color(background);
            scene.environment = environmentRef.current;
        }
        texture.dispose();
        pmremGenerator.dispose();
      });


    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 20;
    controls.target.set(0, 1, 0);
    controls.update();

    // Lighting
    // Key Light
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(-5, 5, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.radius = 8;
    scene.add(keyLight);

    // Fill Light
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
    fillLight.position.set(5, 2, 5);
    scene.add(fillLight);

    // Back Light
    const backLight = new THREE.DirectionalLight(0xffffff, 1.5);
    backLight.position.set(0, 5, -8);
    scene.add(backLight);


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
        const material = new THREE.MeshStandardMaterial(props);
        return material;
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
    } else {
      scene.background = null;
      if (environmentRef.current) {
          scene.environment = environmentRef.current;
      }
    }
  
    const updateObject = (name: string, color: string, materialKey: MaterialKey) => {
      const object = scene.getObjectByName(name);
      if (object) {
        const props = materials[materialKey];
        if (object instanceof THREE.Group) {
          object.children.forEach(child => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
              child.material.color.set(color);
              Object.assign(child.material, props);
              child.material.needsUpdate = true;
            }
          });
        } else if (object instanceof THREE.Mesh && object.material instanceof THREE.MeshStandardMaterial) {
          object.material.color.set(color);
          Object.assign(object.material, props);
          object.material.needsUpdate = true;
        }
      }
    };
  
    updateObject("cap", colors.cap, materialKeys.cap);
    updateObject("body", colors.body, materialKeys.body);
    updateObject("pump", colors.pump, materialKeys.pump);
  
  }, [colors, materialKeys, background]);


  return <div ref={mountRef} className="w-full h-full" />;
};

export default CosmeticCanvas;


    
