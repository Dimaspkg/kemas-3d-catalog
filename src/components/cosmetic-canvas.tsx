
"use client";

import React, { useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { CustomizationState } from "@/components/customization-panel";
import { materials, type MaterialKey } from "@/lib/materials";

type CosmeticCanvasProps = CustomizationState & { 
    modelURL?: string;
    onModelLoad: (partNames: string[]) => void;
};

const CosmeticCanvas: React.FC<CosmeticCanvasProps> = ({
  colors,
  materials: materialKeys,
  background,
  modelURL,
  onModelLoad,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const environmentRef = useRef<THREE.Texture | null>(null);
  const modelRef = useRef<THREE.Group>();
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    if (mountRef.current) {
        mountRef.current.innerHTML = '';
    }
    if (rendererRef.current) {
      const gl = rendererRef.current.getContext();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      rendererRef.current.dispose();
    }
    if (sceneRef.current) {
      sceneRef.current.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else if (object.material) {
            object.material.dispose();
          }
        }
      });
    }
    if (environmentRef.current) {
      environmentRef.current.dispose();
    }
    if (controlsRef.current) {
      controlsRef.current.dispose();
    }
  }, []);


  useEffect(() => {
    if (!mountRef.current) return;
    
    cleanup();

    const currentMount = mountRef.current;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      12, // fov
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;
    camera.position.set(0, 1, 5); // Initial position
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
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.07;
    controls.maxDistance = 50; 
    controls.target.set(0, 1, 0);
    controls.update();

    // Lighting
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(-5, 5, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.radius = 8;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
    fillLight.position.set(5, 2, 5);
    scene.add(fillLight);

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

    // Model Loading
    if (modelURL) {
      const loader = new GLTFLoader();
      loader.load(modelURL, (gltf) => {
        const loadedModel = gltf.scene;
        modelRef.current = loadedModel;

        const partNames: string[] = [];
        loadedModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            const partName = child.name.trim();
            if (partName && !partNames.includes(partName)) {
                partNames.push(partName);
            }
          }
        });
        
        onModelLoad(partNames);
        
        const box = new THREE.Box3().setFromObject(loadedModel);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        loadedModel.position.x += (loadedModel.position.x - center.x);
        loadedModel.position.y += (loadedModel.position.y - center.y);
        loadedModel.position.z += (loadedModel.position.z - center.z);
        
        loadedModel.position.y -= box.min.y;
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        
        cameraZ *= 0.5; // Super Zoom
        camera.position.set(0, size.y / 2, cameraZ);
        
        const newTarget = new THREE.Vector3(0, size.y / 2, 0);
        controls.target.copy(newTarget);

        camera.near = maxDim / 100;
        camera.far = maxDim * 100;
        camera.updateProjectionMatrix();

        scene.add(loadedModel);
        controls.update();
      }, undefined, (error) => {
        console.error("An error happened while loading the model:", error);
      });
    }

    // Animation loop
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current && controlsRef.current) {
        controlsRef.current.update();
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!currentMount || !cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
        window.removeEventListener("resize", handleResize);
        cleanup();
    };
  }, [modelURL, onModelLoad, background, cleanup]); 

  // Effect to update colors and materials
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !modelRef.current) return;

    // Handle background update
    if (background) {
      scene.background = new THREE.Color(background);
      scene.environment = null;
    } else {
      scene.background = null;
      if (environmentRef.current) {
          scene.environment = environmentRef.current;
      }
    }
    
    // Handle part color and material updates
    Object.keys(colors).forEach(partName => {
        const object = modelRef.current?.getObjectByName(partName);
        if (object) {
            const color = colors[partName];
            const materialKey = materialKeys[partName];
            const materialProps = materialKey ? materials[materialKey] : null;

            object.traverse(child => {
                if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                    if (color) {
                        child.material.color.set(color);
                    }
                    if (materialProps) {
                        Object.assign(child.material, materialProps);
                    }
                    child.material.needsUpdate = true;
                }
            });
        }
    });
  
  }, [colors, materialKeys, background]);


  return <div ref={mountRef} className="w-full h-full" />;
};

export default CosmeticCanvas;

    

    