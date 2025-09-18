
"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { CustomizationState } from "@/components/customization-panel";
import { materials, type MaterialKey } from "@/lib/materials";

type CosmeticCanvasProps = Omit<CustomizationState, "brightness"> & { modelURL?: string };

const CosmeticCanvas: React.FC<CosmeticCanvasProps> = ({
  colors,
  materials: materialKeys,
  background,
  modelURL,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const environmentRef = useRef<THREE.Texture | null>(null);
  const modelRef = useRef<THREE.Group>();


  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      14, // fov
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
    
    const updateObject = (name: string, color: string, materialKey: MaterialKey) => {
        const model = modelRef.current;
        if (!model) return;
        
        const object = model.getObjectByName(name);
        if (object) {
          const props = materials[materialKey];
          object.traverse((child) => {
              if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                  child.material.color.set(color);
                  Object.assign(child.material, props);
                  child.material.needsUpdate = true;
              }
          });
        }
    };
    
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
    controls.minDistance = 0.2;
    controls.maxDistance = 50; // Increased max distance for larger models
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
        loadedModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        // Center the model and place it on the floor
        const box = new THREE.Box3().setFromObject(loadedModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        loadedModel.position.sub(center); // Center the model at the origin
        loadedModel.position.y += size.y / 2; // Move the model up so its base is on the floor

        // Adjust camera to fit the model
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 0.5; // super zoom
        
        camera.position.set(0, size.y / 2, cameraZ);
        
        // Adjust controls target to the model's new center
        controls.target.set(0, size.y / 2, 0);
        

        // Adjust clipping planes
        camera.near = maxDim / 100;
        camera.far = maxDim * 100;
        camera.updateProjectionMatrix();

        scene.add(loadedModel);
        modelRef.current = loadedModel;

        // Apply initial customization
        for (const partName in colors) {
          if (Object.prototype.hasOwnProperty.call(colors, partName)) {
            updateObject(partName, colors[partName], materialKeys[partName]);
          }
        }
        
        controls.update();
      });
    } else {
        // Fallback to default geometry if no modelURL
        const bottleGroup = new THREE.Group();
        modelRef.current = bottleGroup;
        scene.add(bottleGroup);

        const defaultParts = {
          body: new THREE.CylinderGeometry(0.8, 0.8, 2, 64),
          cap: new THREE.CylinderGeometry(0.85, 0.85, 0.4, 64),
        };

        const body = new THREE.Mesh(defaultParts.body, new THREE.MeshStandardMaterial());
        body.name = "body";
        body.castShadow = true;
        body.position.y = 1;
        bottleGroup.add(body);
        
        const cap = new THREE.Mesh(defaultParts.cap, new THREE.MeshStandardMaterial());
        cap.name = "cap";
        cap.castShadow = true;
        cap.position.y = 2.2;
        bottleGroup.add(cap);

        const pumpGroup = new THREE.Group();
        pumpGroup.name = "pump";
        const pumpMaterial = new THREE.MeshStandardMaterial();
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

        for (const partName in colors) {
          if (Object.prototype.hasOwnProperty.call(colors, partName)) {
            updateObject(partName, colors[partName], materialKeys[partName]);
          }
        }
    }

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
  // eslint-disable-next-line react-hooks/ exhaustive-deps
  }, [modelURL]); 

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
    
    const updatePart = (name: string, color: string, materialKey: MaterialKey) => {
        const model = modelRef.current;
        if (!model) return;
    
        const object = model.getObjectByName(name);
        if (object) {
            const props = materials[materialKey];
            object.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                    child.material.color.set(color);
                    Object.assign(child.material, props);
                    child.material.needsUpdate = true;
                }
            });
        }
    };
  
    for (const partName in colors) {
        if (Object.prototype.hasOwnProperty.call(colors, partName)) {
            updatePart(partName, colors[partName], materialKeys[partName]);
        }
    }
  
  }, [colors, materialKeys, background]);


  return <div ref={mountRef} className="w-full h-full" />;
};

export default CosmeticCanvas;
