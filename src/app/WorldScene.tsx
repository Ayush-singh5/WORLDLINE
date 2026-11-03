
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { WorldState } from '../simulation/core/types';

interface WorldSceneProps {
  world: WorldState;
  width: number;
  height: number;
}

export function WorldScene({ world, width, height }: WorldSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const plantMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const herbivoreMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const predatorMeshRef = useRef<THREE.InstancedMesh | null>(null);

  // Create the scene and renderer once.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#07110f');
    scene.fog = new THREE.Fog('#07110f', 65, 155);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      300,
    );
    camera.position.set(65, 65, 75);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);
    controls.minDistance = 15;
    controls.maxDistance = 150;
    controls.maxPolarAngle = Math.PI * 0.48;

    scene.add(new THREE.HemisphereLight('#c5f5df', '#17251f', 2));

    const sunlight = new THREE.DirectionalLight('#d5f5c7', 3);
    sunlight.position.set(30, 55, 20);
    scene.add(sunlight);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshStandardMaterial({
        color: '#142b22',
        roughness: 0.95,
        metalness: 0,
      }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.15;
    scene.add(ground);

    const grid = new THREE.GridHelper(
      Math.max(width, height),
      20,
      '#345b49',
      '#203b30',
    );
    grid.position.y = -0.1;
    scene.add(grid);

    const plantMesh = new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.28, 1.2, 5),
      new THREE.MeshStandardMaterial({
        color: '#70c987',
        roughness: 0.85,
      }),
      2000,
    );
    plantMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(plantMesh);

    const herbivoreMesh = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.38, 10, 8),
      new THREE.MeshStandardMaterial({
        color: '#e5c879',
        roughness: 0.65,
      }),
      2000,
    );
    herbivoreMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(herbivoreMesh);

    const predatorMesh = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(0.55, 0),
      new THREE.MeshStandardMaterial({
        color: '#f07862',
        roughness: 0.6,
      }),
      2000,
    );
    predatorMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(predatorMesh);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;
    plantMeshRef.current = plantMesh;
    herbivoreMeshRef.current = herbivoreMesh;
    predatorMeshRef.current = predatorMesh;

    let animationFrame = 0;

    const animate = () => {
      animationFrame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;

      if (w <= 0 || h <= 0) return;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      controls.dispose();

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.InstancedMesh) {
          object.geometry.dispose();

          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      renderer.dispose();
      renderer.domElement.remove();

      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      plantMeshRef.current = null;
      herbivoreMeshRef.current = null;
      predatorMeshRef.current = null;
    };
  }, [width, height]);

  // Update the visible organisms whenever the simulation state changes.
  useEffect(() => {
    const plantMesh = plantMeshRef.current;
    const herbivoreMesh = herbivoreMeshRef.current;
    const predatorMesh = predatorMeshRef.current;

    if (!plantMesh || !herbivoreMesh || !predatorMesh) return;

    const dummy = new THREE.Object3D();

    const placeInstances = (
      mesh: THREE.InstancedMesh,
      entities: { x: number; y: number }[],
      scale: (index: number) => number,
    ) => {
      mesh.count = Math.min(entities.length, mesh.instanceMatrix.count);

      entities.forEach((entity, index) => {
        if (index >= mesh.count) return;

        dummy.position.set(
          entity.x - width / 2,
          0,
          entity.y - height / 2,
        );

        const size = scale(index);
        dummy.scale.setScalar(size);
        dummy.rotation.set(0, (index * 2.399) % (Math.PI * 2), 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
      });

      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    };

    placeInstances(
      plantMesh,
      world.plants,
      (index) => 0.45 + world.plants[index]!.biomass / 100,
    );

    placeInstances(herbivoreMesh, world.herbivores, () => 1);

    placeInstances(predatorMesh, world.predators, () => 1);

    plantMesh.instanceMatrix.needsUpdate = true;
    herbivoreMesh.instanceMatrix.needsUpdate = true;
    predatorMesh.instanceMatrix.needsUpdate = true;
  }, [world, width, height]);

  return <div ref={containerRef} className="world-scene" />;
}
