
"use client";

import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { CustomizationState } from "@/components/customization-panel";
import { materials, type MaterialKey } from "@/lib/materials";
import type { CanvasHandle, Product } from "@/lib/types";
import { Skeleton } from "./ui/skeleton";

const formatPrice = (price?: number) => {
    if (!price) return null;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
};


type CosmeticCanvasProps = CustomizationState & { 
    product?: Product | null;
    modelURL?: string;
    environmentURL?: string;
    onModelLoad: (partNames: string[], initialColors: Record<string, string>) => void;
    onScreenshot: () => void;
};

const CosmeticCanvas = forwardRef<CanvasHandle, CosmeticCanvasProps>(({
  colors,
  materials: materialKeys,
  product,
  modelURL,
  environmentURL,
  onModelLoad,
}, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group>();
  const isInitialModelLoad = useRef(true);
  const [isLoading, setIsLoading] = useState(true);

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
  
  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // --- Core Initialization (only once) ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF8F8F8);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      25,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1, 5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0; 
    rendererRef.current = renderer;
    currentMount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 50; 
    controls.target.set(0, 1, 0);
    controls.update();
    controlsRef.current = controls;
    
    // --- Lighting ---
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(-5, 5, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.radius = 8;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
    fillLight.position.set(5, 2, 5);
    scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 1.5);
    backLight.position.set(0, 5, -8);
    scene.add(backLight);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // --- Floor ---
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.ShadowMaterial({ opacity: 0.2 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // --- Animation Loop ---
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    
    // --- Resize Handler ---
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const newWidth = mountRef.current.clientWidth;
      const newHeight = mountRef.current.clientHeight;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", handleResize);

    // --- Cleanup ---
    return () => {
        window.removeEventListener("resize", handleResize);
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        
        if (modelRef.current) {
            scene.remove(modelRef.current);
            modelRef.current.traverse((object: any) => {
                if (object.isMesh) {
                    if (object.geometry) object.geometry.dispose();
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(material => material.dispose());
                        } else {
                            object.material.dispose();
                        }
                    }
                }
            });
        }

        controls.dispose();

        if (currentMount && rendererRef.current) {
            currentMount.removeChild(rendererRef.current.domElement);
        }
        renderer.dispose();
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect for loading the model
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !modelURL) {
        setIsLoading(false);
        return;
    };
    setIsLoading(true);

    const gltfLoader = new GLTFLoader();
    gltfLoader.load(modelURL, (gltf) => {
        // Remove previous model if it exists
        if (modelRef.current) {
            scene.remove(modelRef.current);
             modelRef.current.traverse((object: any) => {
                if (object.isMesh) {
                    if (object.geometry) object.geometry.dispose();
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(material => material.dispose());
                        } else {
                            object.material.dispose();
                        }
                    }
                }
            });
        }
        
        const loadedModel = gltf.scene;
        modelRef.current = loadedModel;

        const partNames: string[] = [];
        const initialColors: Record<string, string> = {};

        loadedModel.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                const partName = child.name.trim();
                if (partName && !partNames.includes(partName)) {
                    partNames.push(partName);
                    if (child.material instanceof THREE.MeshStandardMaterial) {
                        initialColors[partName] = `#${'#' + child.material.color.getHexString()}`;
                    } else {
                        initialColors[partName] = '#C0C0C0';
                    }
                }
            }
        });
        
        onModelLoad(partNames, initialColors);
        
        const box = new THREE.Box3().setFromObject(loadedModel);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        loadedModel.position.y = -box.min.y;
        
        if (isInitialModelLoad.current && cameraRef.current && controlsRef.current) {
            const camera = cameraRef.current;
            const controls = controlsRef.current;
            
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
            cameraZ *= 1.5; 
            
            camera.position.set(0, center.y > 0 ? center.y : size.y / 2, cameraZ);
            
            controls.target.copy(center);
            controls.target.y = size.y / 2;

            camera.near = maxDim / 100;
            camera.far = maxDim * 100;
            camera.updateProjectionMatrix();

            isInitialModelLoad.current = false;
            controls.update();
        }

        scene.add(loadedModel);
        setIsLoading(false);

    }, undefined, (error) => {
        console.error("An error happened while loading the model:", error);
        setIsLoading(false);
    });

  }, [modelURL, onModelLoad]);


  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !environmentURL) return;

    const loader = environmentURL.endsWith('.hdr') ? new RGBELoader() : new EXRLoader();
    loader.load(environmentURL, (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
    }, undefined, (error) => {
        console.error('An error occurred while loading the environment:', error);
    });

  }, [environmentURL]);


  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !modelRef.current || !colors || !materialKeys) return;

    modelRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const partName = child.name.trim();
        const partColor = colors[partName];
        const partMaterialKey = materialKeys[partName];

        if (partColor && partMaterialKey) {
            const materialProps = materials[partMaterialKey as MaterialKey];
            let material = child.material as THREE.MeshStandardMaterial;

            if (!(material instanceof THREE.MeshStandardMaterial)) {
                const oldMaterial = child.material;
                material = new THREE.MeshStandardMaterial();
                child.material = material;
                if(oldMaterial) oldMaterial.dispose();
            }
            
            material.color.set(partColor);
            material.metalness = materialProps.metalness;
            material.roughness = materialProps.roughness;
            
            if (scene.environment) {
                material.envMap = scene.environment;
            }
            material.needsUpdate = true;
        }
      }
    });
  }, [colors, materialKeys]);


  return (
    <div className="w-full h-full relative">
        <div 
            ref={mountRef} 
            className="w-full h-full"
        />

        {(isLoading || !modelURL) && <Skeleton className="absolute inset-0 w-full h-full" />}

        <div className="absolute bottom-0 left-0 p-6 pointer-events-none text-foreground/80">
            <h1 className="font-semibold text-lg drop-shadow-sm">{product?.name || <Skeleton className="h-6 w-48 bg-black/10" />}</h1>
            {product && product.price ? (
                <p className="drop-shadow-sm">{formatPrice(product.price)}</p>
            ) : (
                product ? null : <Skeleton className="h-5 w-32 mt-1 bg-black/10" />
            )}
        </div>

    </div>
  );
});

CosmeticCanvas.displayName = 'CosmeticCanvas';

export default CosmeticCanvas;

    