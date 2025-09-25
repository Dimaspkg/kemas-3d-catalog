
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
  const modelRef = useRef<THREE.Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fit camera to the loaded model
  const fitCameraToModel = useCallback((model: THREE.Object3D, camera: THREE.PerspectiveCamera, controls: OrbitControls) => {
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      
      // Add some padding so the model is not edge to edge
      cameraZ *= 1.5; 

      camera.position.set(center.x, center.y, center.z + cameraZ);
      controls.target.copy(center);
      
      // Set the floor plane right below the model
      const floor = sceneRef.current?.getObjectByName("floor");
      if (floor) {
          floor.position.y = box.min.y;
      }

      controls.update();
  }, []);

  // Main setup effect, runs only once on mount
  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF8F8F8);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      25,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;

    // Renderer
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

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    // Lights
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(-5, 5, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
    fillLight.position.set(5, 2, 5);
    scene.add(fillLight);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.ShadowMaterial({ opacity: 0.2 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.name = "floor";
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!renderer || !camera || !currentMount) return;
      const newWidth = currentMount.clientWidth;
      const newHeight = currentMount.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      controls.dispose();
      try {
        currentMount.removeChild(renderer.domElement);
      } catch (e) {
        // ignore, it might be already gone
      }
      renderer.dispose();
      
      // Dispose scene resources
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
  }, []);

  // Effect for loading new models
  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!scene || !camera || !controls) return;

    if (modelRef.current) {
        scene.remove(modelRef.current);
    }
    
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

        loadedModel.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                const partName = child.name.trim();
                if (partName) { // Don't check for uniqueness here, just add all
                    partNames.push(partName);
                    if (child.material instanceof THREE.MeshStandardMaterial) {
                        initialColors[partName] = `#${child.material.color.getHexString()}`;
                    }
                }
            }
        });
        
        onModelLoad([...new Set(partNames)], initialColors); // Send unique names to parent
        scene.add(loadedModel);
        fitCameraToModel(loadedModel, camera, controls);
        setIsLoading(false);
    }, undefined, (error) => {
        console.error("An error happened while loading the model:", error);
        setIsLoading(false);
    });

  }, [modelURL, fitCameraToModel, onModelLoad]);
  
  // Effect for environment
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (environmentURL) {
        const loader = environmentURL.endsWith('.hdr') ? new RGBELoader() : new EXRLoader();
        loader.load(environmentURL, (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = texture;
            scene.background = texture;
        }, undefined, (error) => {
            console.error('An error occurred while loading the environment:', error);
            scene.background = new THREE.Color(0xF8F8F8);
        });
    } else {
        scene.environment = null;
        scene.background = new THREE.Color(0xF8F8F8);
    }
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
                material = new THREE.MeshStandardMaterial();
                child.material = material;
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

  // Expose screenshot function via ref
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
