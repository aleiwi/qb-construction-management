import React, { useRef, useState, useMemo } from 'react';
import { useLazyImage, useAnimationFrame } from '../../hooks/qb/usePerformance';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';

const ModelViewer = ({ modelPath, autoRotate, zoomLevel }) => {
  const modelRef = useRef(null);
  useLazyImage(modelRef);
  useAnimationFrame(() => {});
  const group = useRef();
  const [hovered, setHovered] = useState(null);
  const [clicked, setClicked] = useState(null);

  const { scene, nodes, materials } = useGLTF(modelPath);

  useFrame((state, delta) => {
    if (group.current && autoRotate) {
      group.current.rotation.y += delta * 0.5;
    }
  });

  const handlePointerOver = (e) => {
    e.stopPropagation();
    setHovered(e.object);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(null);
    document.body.style.cursor = 'auto';
  };

  return (
    <group ref={group} onClick={(e) => setClicked(e.object)} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
      <primitive object={scene} scale={0.01} />
      {hovered && (
        <Html distanceFactor={10} position={[0, 2, 0]} center>
          <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm shadow-xl border border-slate-700">
            <p className="font-bold">نموذج ثلاثي الأبعاد</p>
            <p className="text-gray-400 text-xs">اضغط للتفاعل</p>
          </div>
        </Html>
      )}
    </group>
  );
};

const BuildingFloor = ({ position, color = '#4A90D9', opacity = 0.3 }) => {
  return (
    <mesh position={position} receiveShadow>
      <planeGeometry args={[20, 15]} />
      <meshStandardMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} />
    </mesh>
  );
};

const ProjectModelViewer = ({ modelUrl, projectName, floors = 3 }) => {
  const [cameraPosition, setCameraPosition] = useState([30, 20, 30]);
  const [showGrid, setShowGrid] = useState(true);
  const [viewMode, setViewMode] = useState('3d'); // '3d' or '2d'

  return (
    <div className="w-full h-[600px] bg-slate-950 rounded-xl overflow-hidden relative" dir="rtl">
      <Canvas shadows camera={{ position: cameraPosition, fov: 50 }} gl={{ antialias: true }}>
        <PerspectiveCamera makeDefault position={cameraPosition} fov={50} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[20, 30, 20]} intensity={0.8} castShadow shadow-mapSize={[2048, 2048]} />
        <spotLight position={[0, 40, 0]} intensity={0.5} angle={0.3} penumbra={0.5} />

        {viewMode === '3d' && modelUrl ? (
          <ModelViewer modelPath={modelUrl} autoRotate={true} zoomLevel={1} />
        ) : (
          <>
            {Array.from({ length: floors }).map((_, i) => (
              <BuildingFloor key={i} position={[0, i * 5, 0]} color={i === 0 ? '#6B7280' : '#93C5FD'} />
            ))}
            {showGrid && (
              <gridHelper args={[40, 40, '#4B5563', '#374151']} position={[0, -0.1, 0]} />
            )}
          </>
        )}

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={100}
          maxPolarAngle={Math.PI / 2}
          target={[0, 2, 0]}
        />
        <Environment preset="city" />
      </Canvas>

      {/* Controls Overlay */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <button onClick={() => setViewMode(viewMode === '3d' ? '2d' : '3d')} className="bg-slate-800/80 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm backdrop-blur-sm transition-colors">
          {viewMode === '3d' ? '2D View' : '3D View'}
        </button>
        <button onClick={() => setShowGrid(!showGrid)} className="bg-slate-800/80 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm backdrop-blur-sm transition-colors">
          {showGrid ? 'Hide Grid' : 'Show Grid'}
        </button>
      </div>

      <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
        <h4 className="font-bold mb-1">{projectName}</h4>
        <p className="text-gray-400 text-xs">{viewMode === '3d' ? 'ثلاثي الأبعاد' : 'ثنائي الأبعاد'}</p>
        <div className="mt-2 space-y-1">
          <p className="text-xs text-gray-400">拖动鼠标旋转</p>
          <p className="text-xs text-gray-400">滚轮缩放</p>
          <p className="text-xs text-gray-400">右键平移</p>
        </div>
      </div>
    </div>
  );
};

export default ProjectModelViewer;
