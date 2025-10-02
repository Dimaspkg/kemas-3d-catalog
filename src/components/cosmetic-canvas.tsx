
"use client";

import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { CustomizationState } from "@/components/customization-panel";
import type { CanvasHandle, Product, Hotspot, Material } from "@/lib/types";

type CosmeticCanvasProps = CustomizationState & { 
    product?: Product | null;
    materialsData: Material[];
    modelURL?: string;
    environmentURL?: string;
    onModelLoad: (partNames: string[], initialColors: Record<string, string>) => void;
    onLoadingChange: (isLoading: boolean) => void;
    onHotspotClick: (hotspot: Hotspot) => void;
};

const CosmeticCanvas = forwardRef<CanvasHandle, CosmeticCanvasProps>(({
  colors,
  materials: materialKeys,
  materialsData,
  product,
  modelURL,
  environmentURL,
  onModelLoad,
  onLoadingChange,
  onHotspotClick,
}, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const hotspotsRef = useRef<THREE.Group>(new THREE.Group());
  const [isLoading, setIsLoading] = useState(true);
  const [hasCustomized, setHasCustomized] = useState(false);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  useEffect(() => {
    onLoadingChange(isLoading);
  }, [isLoading, onLoadingChange]);
  
  const fitCameraToModel = useCallback((model: THREE.Object3D, camera: THREE.PerspectiveCamera, controls: OrbitControls) => {
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      
      cameraZ *= 1.5; 

      camera.position.set(center.x, center.y, center.z + cameraZ);
      controls.target.copy(center);
      
      controls.update();
  }, []);

  const handleCanvasClick = useCallback((event: MouseEvent) => {
    if (!mountRef.current || !cameraRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, cameraRef.current);

    const intersects = raycaster.current.intersectObjects(hotspotsRef.current.children);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        const hotspotData = clickedObject.userData as Hotspot;
        if (hotspotData && onHotspotClick) {
            onHotspotClick(hotspotData);
        }
    }
  }, [onHotspotClick]);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF8F8F8);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      25,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(-5, 5, 5);
    keyLight.castShadow = true;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
    fillLight.position.set(5, 2, 5);
    scene.add(fillLight);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Shadow catcher plane
    const planeGeometry = new THREE.PlaneGeometry(20, 20);
    const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.2 });
    const shadowPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -5; // Adjust this based on your model's position
    shadowPlane.name = "shadowPlane";
    scene.add(shadowPlane);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!renderer || !camera || !currentMount) return;
      const newWidth = currentMount.clientWidth;
      const newHeight = currentMount.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", handleResize);
    currentMount.addEventListener('click', handleCanvasClick);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (currentMount) {
        currentMount.removeEventListener('click', handleCanvasClick);
      }
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      controls.dispose();
      try {
        currentMount.removeChild(renderer.domElement);
      } catch (e) {
      }
      renderer.dispose();
      
       scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
            if (object.geometry) object.geometry.dispose();
            if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
            } else if (object.material) {
                object.material.dispose();
            }
        }
      });
    };
  }, [handleCanvasClick]);

  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!scene || !camera || !controls) return;

    if (modelRef.current) {
        scene.remove(modelRef.current);
    }
    if (hotspotsRef.current) {
        scene.remove(hotspotsRef.current);
        hotspotsRef.current = new THREE.Group();
    }
    
    setHasCustomized(false);
    if (!modelURL) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(modelURL, (gltf) => {
        const loadedModel = gltf.scene;
        modelRef.current = loadedModel;

        const partNames: string[] = [];
        const initialColors: Record<string, string> = {};
        
        const box = new THREE.Box3().setFromObject(loadedModel);
        const modelFloorY = box.min.y;

        const shadowPlane = scene.getObjectByName("shadowPlane");
        if (shadowPlane) {
            shadowPlane.position.y = modelFloorY - 0.01;
        }

        loadedModel.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                const partName = child.name.trim() || 'unnamed_part';

                if (!partNames.includes(partName)) {
                    partNames.push(partName);
                    if (child.material instanceof THREE.MeshStandardMaterial) {
                        initialColors[partName] = `#${child.material.color.getHexString()}`;
                    }
                }
            }
        });
        
        onModelLoad(partNames, initialColors);
        scene.add(loadedModel);
        
        // Add hotspots
        if (product?.hotspots) {
            const hotspotGeometry = new THREE.SphereGeometry(0.05, 16, 16); 

            product.hotspots.forEach(hp => {
                // Use a visible but non-intrusive material for hotspots
                const hotspotMaterial = new THREE.MeshBasicMaterial({ color: 0xff4500, transparent: true, opacity: 0.7 });
                const hotspotMesh = new THREE.Mesh(hotspotGeometry, hotspotMaterial);
                hotspotMesh.position.set(hp.position.x, hp.position.y, hp.position.z);
                hotspotMesh.name = `hotspot_${hp.id}`;
                hotspotMesh.userData = hp;
                hotspotsRef.current.add(hotspotMesh);
            });
            scene.add(hotspotsRef.current);
        }

        fitCameraToModel(loadedModel, camera, controls);
        setIsLoading(false);
    }, undefined, (error) => {
        console.error("An error happened while loading the model:", error);
        setIsLoading(false);
    });

  }, [modelURL, product, fitCameraToModel, onModelLoad]);
  
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    scene.background = new THREE.Color(0xF8F8F8);
    scene.environment = null;

    if (environmentURL) {
        const loader = environmentURL.endsWith('.hdr') ? new RGBELoader() : new EXRLoader();
        loader.load(environmentURL, (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = texture;
        }, undefined, (error) => {
            console.error('An error occurred while loading the environment:', error);
            scene.environment = null;
        });
    }
  }, [environmentURL]);

  useEffect(() => {
    if (!hasCustomized) return;
    if (!modelRef.current || !colors || !materialKeys || !materialsData) return;

    const materialsMap = new Map(materialsData.map(m => [m.id, m]));

    modelRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const partName = child.name.trim();
        const partColor = colors[partName];
        const partMaterialId = materialKeys[partName];
        
        if (partColor && partMaterialId) {
            const materialProps = materialsMap.get(partMaterialId);
            if (!materialProps) return;

            let material = child.material as THREE.MeshPhysicalMaterial;

            const opacity = materialProps.opacity ?? 1;
            const isTransparent = opacity < 1;

            if (!(material instanceof THREE.MeshPhysicalMaterial) || material.name !== partMaterialId) {
                material = new THREE.MeshPhysicalMaterial({});
                material.name = partMaterialId;
                child.material = material;
            }
            
            material.color.set(partColor);
            material.metalness = materialProps.metalness;
            material.roughness = materialProps.roughness;
            material.envMapIntensity = materialProps.envMapIntensity ?? 1;

            // Handle transparency
            if (isTransparent) {
                material.transmission = 1; // Use transmission for physically-based transparency
                material.transparent = true;
                material.opacity = opacity; // Still useful for blending
                material.thickness = materialProps.thickness ?? 0;
                material.ior = materialProps.ior ?? 1.5;
                material.roughnessTransmission = materialProps.roughnessTransmission ?? 0;
            } else {
                material.transmission = 0;
                material.transparent = false;
                material.opacity = 1;
                material.thickness = 0;
                material.ior = 1.5; // Reset IOR for non-transparent materials
                material.roughnessTransmission = 0;
            }
            
            // Handle iridescence
            material.iridescence = materialProps.iridescence ?? 0;
            if (material.iridescence > 0) {
              material.iridescenceIOR = materialProps.iridescenceIOR ?? 1.3;
              material.iridescenceThicknessRange = materialProps.iridescenceThicknessRange ?? [100, 400];
            }

            // Handle sheen
            material.sheen = materialProps.sheen ?? 0;
            if (material.sheen > 0) {
                material.sheenColor.set(materialProps.sheenColor ?? '#ffffff');
                material.sheenRoughness = materialProps.sheenRoughness ?? 1;
            }

            material.dithering = true;
            
            if (sceneRef.current?.environment) {
                material.envMap = sceneRef.current.environment;
            }
            material.needsUpdate = true;
        }
      }
    });
  }, [colors, materialKeys, hasCustomized, materialsData]);

  useEffect(() => {
    if (Object.keys(colors).length > 0 || Object.keys(materialKeys).length > 0) {
      if(!hasCustomized) {
        const isCustomized = Object.entries(colors).some(([key, value]) => value !== '#000000') || Object.entries(materialKeys).some(([key, value]) => value !== '');
        if(isCustomized) {
          setHasCustomized(true);
        }
      }
    }
  }, [colors, materialKeys, hasCustomized]);

  useImperativeHandle(ref, () => ({
    takeScreenshot: () => {
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
        const dataURL = renderer.domElement.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'product-customization.png';
        link.href = dataURL;
        link.click();
      }
    }
  }));

  return (
    <div className="w-full h-full relative">
        <div 
            ref={mountRef} 
            className="w-full h-full"
        />
    </div>
  );
});

CosmeticCanvas.displayName = 'CosmeticCanvas';

export default CosmeticCanvas;
