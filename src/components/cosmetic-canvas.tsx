
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

  // Main effect for initialization and model loading
  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // --- Core Initialization ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF8F8F8);
    const camera = new THREE.PerspectiveCamera(
      25,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0; 
    
    // Store references
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    currentMount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 50; 
    controlsRef.current = controls;
    
    // --- Lighting ---
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(-5, 5, 5);
    keyLight.castShadow = true;
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

    // --- Model Loading ---
    if (modelURL) {
      setIsLoading(true);
      const gltfLoader = new GLTFLoader();
      gltfLoader.load(modelURL, (gltf) => {
        if (modelRef.current) {
          scene.remove(modelRef.current);
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
                    }
                }
            }
        });
        
        onModelLoad(partNames, initialColors);
        
        const box = new THREE.Box3().setFromObject(loadedModel);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        
        cameraZ *= 1.5; // Zoom out a bit to fit the model nicely

        loadedModel.position.y = -box.min.y;

        camera.position.set(center.x, center.y, center.z + cameraZ);
        
        const newTarget = new THREE.Vector3(center.x, center.y + size.y / 2, center.z);
        controls.target.copy(newTarget);
        
        scene.add(loadedModel);
        setIsLoading(false);
      }, undefined, (error) => {
          console.error("An error happened while loading the model:", error);
          setIsLoading(false);
      });
    } else {
        setIsLoading(false);
    }

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
        const newWidth = currentMount.clientWidth;
        const newHeight = currentMount.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", handleResize);

    // --- Cleanup ---
    return () => {
        window.removeEventListener("resize", handleResize);
        cancelAnimationFrame(animationFrameId);
        controls.dispose();
        if (modelRef.current) {
            scene.remove(modelRef.current);
        }
        currentMount.removeChild(renderer.domElement);
        renderer.dispose();
    };
  }, [modelURL, onModelLoad]);
  
  // Effect for environment
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


  // Effect for applying customizations
  useEffect(() => {
    if (!modelRef.current || !colors || !materialKeys) return;

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
            
            if (sceneRef.current?.environment) {
                material.envMap = sceneRef.current.environment;
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

    