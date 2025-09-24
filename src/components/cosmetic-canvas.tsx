
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
import { Button } from "./ui/button";
import { Camera } from "lucide-react";
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
  logos,
  product,
  modelURL,
  environmentURL,
  onModelLoad,
  onScreenshot,
}, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const environmentRef = useRef<THREE.Texture | null>(null);
  const modelRef = useRef<THREE.Group>();
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  useImperativeHandle(ref, () => ({
    takeScreenshot: () => {
      const renderer = rendererRef.current;
      if (renderer) {
        // Force a render of the current frame
        renderer.render(sceneRef.current!, cameraRef.current!);
        
        // Capture the canvas content
        const dataURL = renderer.domElement.toDataURL('image/png');
        
        // Trigger a download
        const link = document.createElement('a');
        link.download = 'product-customization.png';
        link.href = dataURL;
        link.click();
      }
    }
  }));


  const cleanup = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null;
    }
    if (mountRef.current) {
        // Clear only canvas, not the entire div
        const canvas = mountRef.current.querySelector('canvas');
        if (canvas) {
            mountRef.current.removeChild(canvas);
        }
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
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    rendererRef.current = renderer;
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    currentMount.appendChild(renderer.domElement);
    
    // Environment
    const loadEnvironment = (url: string) => {
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        
        const isExr = url.toLowerCase().endsWith('.exr');
        const loader = isExr ? new EXRLoader() : new RGBELoader();
        
        loader.load(url, (texture) => {
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            environmentRef.current = envMap;
            scene.environment = envMap;
            scene.background = new THREE.Color(0xF8F8F8);
            texture.dispose();
            pmremGenerator.dispose();
        }, undefined, (error) => {
            console.error(`Failed to load environment map: ${url}`, error);
            // Fallback to default if custom fails
            if (url !== '/hdr/soft_studio.hdr') {
                loadEnvironment('/hdr/soft_studio.hdr');
            }
        });
    }

    const envMapURL = environmentURL || '/hdr/soft_studio.hdr';
    loadEnvironment(envMapURL);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.02;
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
                    initialColors[partName] = '#C0C0C0'; // Fallback
                }
            }
          }
        });
        
        onModelLoad(partNames, initialColors);
        
        const box = new THREE.Box3().setFromObject(loadedModel);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        loadedModel.position.y = -box.min.y;
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        
        cameraZ *= 1.5; 
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
  }, [modelURL, onModelLoad, cleanup, environmentURL]); 


  // Effect to update colors, materials, and logos
  useEffect(() => {
    if (!modelRef.current || !colors || !materialKeys || !logos) return;

    const textureLoader = new THREE.TextureLoader();

    modelRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const partName = child.name.trim();
        const partColor = colors[partName];
        const partMaterialKey = materialKeys[partName];
        const partLogo = logos[partName];

        if (partColor && partMaterialKey) {
            const materialProps = materials[partMaterialKey as MaterialKey];
            
            if (child.material instanceof THREE.MeshStandardMaterial) {
                child.material.color.set(partColor);
                child.material.metalness = materialProps.metalness;
                child.material.roughness = materialProps.roughness;
                
                if (partLogo) {
                    textureLoader.load(partLogo, (texture) => {
                        texture.flipY = false; // Important for GLTF models
                        child.material.map = texture;
                        child.material.needsUpdate = true;
                    });
                } else {
                    if (child.material.map) {
                        child.material.map.dispose();
                    }
                    child.material.map = null;
                }
                
                child.material.needsUpdate = true;
            } else {
                 const newMaterial = new THREE.MeshStandardMaterial({
                    color: partColor,
                    metalness: materialProps.metalness,
                    roughness: materialProps.roughness,
                    envMap: environmentRef.current,
                });

                if (partLogo) {
                    textureLoader.load(partLogo, (texture) => {
                         texture.flipY = false;
                         newMaterial.map = texture;
                         newMaterial.needsUpdate = true;
                    });
                }
                child.material = newMaterial;
            }
        }
      }
    });
  }, [colors, materialKeys, logos]);


  return (
    <div className="w-full h-full relative">
        <div 
            ref={mountRef} 
            className="w-full h-full"
        />

        <div className="absolute top-0 left-0 p-4 pointer-events-none">
            <h1 className="font-semibold text-lg">{product?.name || <Skeleton className="h-6 w-48" />}</h1>
            {product ? (
                <p className="text-muted-foreground">{formatPrice(product.price)}</p>
            ) : (
                <div className="text-muted-foreground">
                    <Skeleton className="h-5 w-32 mt-1" />
                </div>
            )}
        </div>

        <div className="absolute top-0 right-0 p-4">
            <Button onClick={onScreenshot}>
                <Camera className="mr-2 h-4 w-4" />
                Screenshot
            </Button>
        </div>

    </div>
  );
});

CosmeticCanvas.displayName = 'CosmeticCanvas';

export default CosmeticCanvas;
