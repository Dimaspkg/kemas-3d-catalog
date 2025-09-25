

"use client";

import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
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
  const environmentRef = useRef<THREE.Texture | null>(null);
  const modelRef = useRef<THREE.Group>();
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const isInitialModelLoad = useRef(true);

  useImperativeHandle(ref, () => ({
    takeScreenshot: () => {
      const renderer = rendererRef.current;
      if (renderer) {
        renderer.render(sceneRef.current!, cameraRef.current!);
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
    
    // Only initialize the scene once
    if (!sceneRef.current) {
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        scene.background = new THREE.Color(0xF8F8F8);

        const camera = new THREE.PerspectiveCamera(
          12,
          currentMount.clientWidth / currentMount.clientHeight,
          0.1,
          1000
        );
        cameraRef.current = camera;
        camera.position.set(0, 1, 5);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        rendererRef.current = renderer;
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0; 
        currentMount.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controlsRef.current = controls;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 2; // Adjusted minDistance
        controls.maxDistance = 50; 
        controls.target.set(0, 1, 0);
        controls.update();

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

        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floorMaterial = new THREE.ShadowMaterial({ opacity: 0.2 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        scene.add(floor);
        
        const animate = () => {
          animationFrameIdRef.current = requestAnimationFrame(animate);
          if (rendererRef.current && sceneRef.current && cameraRef.current && controlsRef.current) {
            controlsRef.current.update();
            rendererRef.current.render(sceneRef.current, cameraRef.current);
          }
        };
        animate();
        
        const handleResize = () => {
          if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
          const newWidth = mountRef.current.clientWidth;
          const newHeight = mountRef.current.clientHeight;
          cameraRef.current.aspect = newWidth / newHeight;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newWidth, newHeight);
        };
        window.addEventListener("resize", handleResize);

        // Cleanup function for when the component unmounts
        return () => {
            window.removeEventListener("resize", handleResize);
            if (animationFrameIdRef.current) {
              cancelAnimationFrame(animationFrameIdRef.current);
            }
            if (rendererRef.current) {
              if (currentMount && rendererRef.current.domElement.parentNode === currentMount) {
                currentMount.removeChild(rendererRef.current.domElement);
              }
              rendererRef.current.dispose();
            }
        };
    }
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !environmentURL) return;

    const loader = environmentURL.endsWith('.hdr') ? new RGBELoader() : new EXRLoader();
    loader.load(environmentURL, (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        environmentRef.current = texture;
        scene.environment = texture;
    }, undefined, (error) => {
        console.error('An error occurred while loading the environment:', error);
    });

  }, [environmentURL]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !modelURL) return;

    const gltfLoader = new GLTFLoader();
    const camera = cameraRef.current!;
    const controls = controlsRef.current!;

    if (modelRef.current) {
        scene.remove(modelRef.current);
    }
    
    gltfLoader.load(modelURL, (gltf) => {
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
                        initialColors[partName] = `#${child.material.color.getHexString()}`;
                    } else {
                        initialColors[partName] = '#C0C0C0';
                    }
                }
            }
        });
        
        if (isInitialModelLoad.current) {
            onModelLoad(partNames, initialColors);
        }
        
        const box = new THREE.Box3().setFromObject(loadedModel);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        loadedModel.position.y = -box.min.y;
        
        // This camera/controls adjustment should only happen on the first load
        if (isInitialModelLoad.current) {
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
            cameraZ *= 2.5; // Zoom out a bit
            
            camera.position.set(0, center.y, cameraZ);
            
            controls.target.copy(center);
            controls.target.y = size.y / 2;

            camera.near = maxDim / 100;
            camera.far = maxDim * 100;
            camera.updateProjectionMatrix();

            isInitialModelLoad.current = false;
        }

        scene.add(loadedModel);
        controls.update();

    }, undefined, (error) => {
        console.error("An error happened while loading the model:", error);
    });

  }, [modelURL, onModelLoad]);

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

            // Ensure we have a standard material to work with
            if (!(material instanceof THREE.MeshStandardMaterial)) {
                const oldMaterial = child.material;
                material = new THREE.MeshStandardMaterial();
                child.material = material;
                if(oldMaterial) oldMaterial.dispose();
            }
            
            material.color.set(partColor);
            material.metalness = materialProps.metalness;
            material.roughness = materialProps.roughness;
            
            material.envMap = environmentRef.current;
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

        <div className="absolute bottom-0 left-0 p-6 pointer-events-none text-foreground/80">
            <h1 className="font-semibold text-lg drop-shadow-sm">{product?.name || <Skeleton className="h-6 w-48 bg-black/10" />}</h1>
            {product ? (
                <p className="drop-shadow-sm">{formatPrice(product.price)}</p>
            ) : (
                <div>
                    <Skeleton className="h-5 w-32 mt-1 bg-black/10" />
                </div>
            )}
        </div>

    </div>
  );
});

CosmeticCanvas.displayName = 'CosmeticCanvas';

export default CosmeticCanvas;
