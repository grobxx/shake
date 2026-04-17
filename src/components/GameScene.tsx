/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useEffect, useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore, globalGameState } from '../store/gameStore';
import { WORLD_SIZE, TURN_SPEED, BOOST_SPEED, BASE_SPEED, INITIAL_LENGTH, SEGMENT_SPACING, COLORS, ORB_SPAWN_RATE, MAX_ORBS } from '../shared/types';
import * as THREE from 'three';
import { Sphere, Grid } from '@react-three/drei';
import { v4 as uuidv4 } from 'uuid';

function Snake({ playerId, color, isLocal }: { playerId: string, color: string, isLocal: boolean }) {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!bodyRef.current || !headRef.current) return;
    const gs = globalGameState.current;
    if (!gs) return;
    
    const player = gs.players[playerId];
    if (!player || player.segments.length === 0) {
      bodyRef.current.count = 0;
      headRef.current.visible = false;
      return;
    }
    
    headRef.current.visible = true;
    const count = player.segments.length;
    bodyRef.current.count = Math.max(0, count - 1);

    for (let i = 0; i < count; i++) {
      let targetX = player.segments[i].x;
      let targetY = player.segments[i].y;
            
      if (i === 0) {
        headRef.current.position.set(targetX, targetY, 0.5);
      } else {
        dummy.position.set(targetX, targetY, 0.5);
        dummy.updateMatrix();
        bodyRef.current.setMatrixAt(i - 1, dummy.matrix);
      }
    }
    bodyRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <Sphere ref={headRef} castShadow receiveShadow args={[0.8, 16, 16]}>
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          metalness={0.8}
          toneMapped={false}
          onBeforeCompile={(shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <emissivemap_fragment>',
              `
              #include <emissivemap_fragment>
              float fresnel = pow(1.0 - max(dot(normal, normalize(vViewPosition)), 0.0), 2.0);
              totalEmissiveRadiance += diffuseColor.rgb * (0.4 + fresnel * 3.0);
              `
            );
          }}
        />
      </Sphere>
      <instancedMesh ref={bodyRef} args={[null as any, null as any, 2000]} castShadow receiveShadow frustumCulled={false}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          metalness={0.8}
          toneMapped={false}
          onBeforeCompile={(shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <emissivemap_fragment>',
              `
              #include <emissivemap_fragment>
              float fresnel = pow(1.0 - max(dot(normal, normalize(vViewPosition)), 0.0), 2.0);
              totalEmissiveRadiance += diffuseColor.rgb * (0.4 + fresnel * 1.5);
              `
            );
          }}
        />
      </instancedMesh>
    </group>
  );
}

function Orbs() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorObj = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    if (!meshRef.current) return;
    const gs = globalGameState.current;
    if (!gs) return;

    let i = 0;
    for (const orbId in gs.orbs) {
      const orb = gs.orbs[orbId];
      dummy.position.set(orb.x, orb.y, 0.5);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      colorObj.set(orb.color);
      meshRef.current.setColorAt(i, colorObj);
      i++;
    }
    meshRef.current.count = i;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null as any, null as any, MAX_ORBS + 1000]} castShadow receiveShadow frustumCulled={false}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial
        roughness={0.4}
        metalness={0.1}
        toneMapped={false}
        onBeforeCompile={(shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <emissivemap_fragment>',
            `
            #include <emissivemap_fragment>
            totalEmissiveRadiance += diffuseColor.rgb * 2.5;
            `
          );
        }}
      />
    </instancedMesh>
  );
}

export function GameScene() {
  const { gameState, playerId, difficulty, updateUiState } = useGameStore();
  const { camera } = useThree();
  const inputs = useRef({ left: false, right: false, boost: false });
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const [lightTarget] = useState(() => new THREE.Object3D());
  const lastUiUpdateRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') && !inputs.current.left) { inputs.current.left = true; }
      if ((e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') && !inputs.current.right) { inputs.current.right = true; }
      if ((e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') && !inputs.current.boost) { inputs.current.boost = true; }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if ((e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') && inputs.current.left) { inputs.current.left = false; }
      if ((e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') && inputs.current.right) { inputs.current.right = false; }
      if ((e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') && inputs.current.boost) { inputs.current.boost = false; }
    };

    const handleBlur = () => {
      inputs.current = { left: false, right: false, boost: false };
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useFrame((state, delta) => {
    const gs = globalGameState.current;
    if (!gs) return;

    // Simulation loop
    const boundary = WORLD_SIZE / 2;
    const now = Date.now();

    // Spawn orbs randomly
    if (Object.keys(gs.orbs).length < MAX_ORBS && Math.random() < ORB_SPAWN_RATE * delta * 60) {
       const oId = uuidv4();
       gs.orbs[oId] = {
           id: oId,
           x: (Math.random() - 0.5) * WORLD_SIZE,
           y: (Math.random() - 0.5) * WORLD_SIZE,
           value: 1,
           color: COLORS[Math.floor(Math.random() * COLORS.length)]
       };
    }

    // Process players
    for (const pId in gs.players) {
       const p = gs.players[pId];

       if (p.state === 'dead') {
           if (p.isBot) {
               if (!p.deadSince) p.deadSince = now;
               // Respawn bots after 3 seconds
               if (now - p.deadSince > 3000) {
                   p.state = 'alive';
                   p.score = INITIAL_LENGTH;
                   p.color = COLORS[Math.floor(Math.random() * COLORS.length)];
                   p.currentAngle = Math.random() * Math.PI * 2;
                   const startX = (Math.random() - 0.5) * (WORLD_SIZE - 20);
                   const startY = (Math.random() - 0.5) * (WORLD_SIZE - 20);
                   p.segments = [];
                   for (let i = 0; i < INITIAL_LENGTH; i++) {
                     p.segments.push({
                       x: startX - Math.cos(p.currentAngle) * i * SEGMENT_SPACING,
                       y: startY - Math.sin(p.currentAngle) * i * SEGMENT_SPACING,
                     });
                   }
                   p.deadSince = undefined;
               }
           }
           continue;
       }

       const head = p.segments[0];

       // Movement Logic
       if (p.isBot) {
           const distToWallX = boundary - Math.abs(head.x);
           const distToWallY = boundary - Math.abs(head.y);
           
           let targetX = 0;
           let targetY = 0;
           let hasTarget = false;
           let nearestDist = Infinity;
           
           // Evade wall
           if (distToWallX < 15 || distToWallY < 15) {
             targetX = 0;
             targetY = 0;
             hasTarget = true;
           } else {
             // Find nearest orb
             for (const orbId in gs.orbs) {
               const orb = gs.orbs[orbId];
               const dx = head.x - orb.x;
               const dy = head.y - orb.y;
               const dist = dx*dx + dy*dy;
               if (dist < nearestDist) {
                   nearestDist = dist;
                   targetX = orb.x;
                   targetY = orb.y;
                   hasTarget = true;
               }
             }
           }
           
           if (hasTarget) {
             const angleToTarget = Math.atan2(targetY - head.y, targetX - head.x);
             let angleDiff = angleToTarget - p.currentAngle;
             while(angleDiff > Math.PI) angleDiff -= Math.PI * 2;
             while(angleDiff < -Math.PI) angleDiff += Math.PI * 2;
             
             const tSpeed = difficulty === 'easy' ? TURN_SPEED * 0.4 : (difficulty === 'normal' ? TURN_SPEED * 0.7 : TURN_SPEED);
             if (angleDiff > 0.05) {
                p.currentAngle += tSpeed * delta;
             } else if (angleDiff < -0.05) {
                p.currentAngle -= tSpeed * delta;
             }
             
             if (difficulty === 'hard' && Math.abs(angleDiff) < 0.2 && nearestDist > 200 && p.score > 20) {
               p.isBoosting = true;
             } else {
               p.isBoosting = false;
             }
           } else {
               p.isBoosting = false;
           }
       } else {
           // Local Player Inputs
           if (inputs.current.left) p.currentAngle += TURN_SPEED * delta;
           if (inputs.current.right) p.currentAngle -= TURN_SPEED * delta;
           p.isBoosting = inputs.current.boost && p.score > 10;
       }

       const speed = p.isBoosting ? BOOST_SPEED : BASE_SPEED;
       const newHead = {
         x: head.x + Math.cos(p.currentAngle) * speed * delta,
         y: head.y + Math.sin(p.currentAngle) * speed * delta,
       };

       if (newHead.x < -boundary) newHead.x = -boundary;
       if (newHead.x > boundary) newHead.x = boundary;
       if (newHead.y < -boundary) newHead.y = -boundary;
       if (newHead.y > boundary) newHead.y = boundary;

       p.segments.unshift(newHead);

       if (p.isBoosting) {
         p.score -= 2 * delta;
         if (p.score <= 10) {
           p.isBoosting = false;
           p.score = 10;
         }
         // Drop orb randomly while boosting
         if (Math.random() < 0.1 * (delta * 60)) {
            const tail = p.segments[p.segments.length - 1];
            const oId = uuidv4();
            gs.orbs[oId] = {
               id: oId, x: tail.x, y: tail.y, value: 1, color: p.color
            };
         }
       }

       const tl = Math.floor(p.score);
       while (p.segments.length > tl) {
         p.segments.pop();
       }
    }

    // Collisions
    for (const pId in gs.players) {
       const p = gs.players[pId];
       if (p.state !== 'alive') continue;
       const head = p.segments[0];

       // Orbs
       for (const orbId in gs.orbs) {
          const orb = gs.orbs[orbId];
          const dx = head.x - orb.x;
          const dy = head.y - orb.y;
          if (dx*dx + dy*dy < 4) {
             p.score += orb.value;
             delete gs.orbs[orbId];
          }
       }

       // Snakes
       let collided = false;
       for (const oId in gs.players) {
          const other = gs.players[oId];
          if (other.state !== 'alive') continue;
          
          if (oId === pId) {
             // Self collision check starts far enough back
             for (let i = 15; i < p.segments.length; i++) {
                const dx = head.x - p.segments[i].x;
                const dy = head.y - p.segments[i].y;
                if (dx*dx + dy*dy < 2.25) {
                   collided = true; break;
                }
             }
          } else {
             for (const seg of other.segments) {
                const dx = head.x - seg.x;
                const dy = head.y - seg.y;
                if (dx*dx + dy*dy < 2.25) {
                   collided = true; break;
                }
             }
          }
          if (collided) break;
       }

       if (collided) {
          p.state = 'dead';
          // turn half of segments into orbs
          p.segments.forEach((seg, i) => {
             if (i % 2 === 0) {
                 const oId = uuidv4();
                 gs.orbs[oId] = { id: oId, x: seg.x, y: seg.y, value: 1, color: p.color };
             }
          });
          p.segments = [];
       }
    }

    // Camera follow for local player
    if (playerId) {
       const localPlayer = gs.players[playerId];
       if (localPlayer && localPlayer.state === 'alive' && localPlayer.segments.length > 0) {
           const head = localPlayer.segments[0];
           const targetZ = Math.min(45, Math.max(20, 20 + localPlayer.score * 0.2));
           camera.position.x += (head.x - camera.position.x) * 10 * delta;
           camera.position.y += (head.y - camera.position.y) * 10 * delta;
           camera.position.z += (targetZ - camera.position.z) * 4 * delta;
           camera.lookAt(camera.position.x, camera.position.y, 0);

           if (lightRef.current) {
             lightRef.current.position.set(camera.position.x + 10, camera.position.y - 10, 30);
             lightTarget.position.set(camera.position.x, camera.position.y, 0);
           }
       }
    }

    // Periodically update React UI State (10Hz)
    if (now - lastUiUpdateRef.current > 100) {
       gs.leaderboard = Object.values(gs.players)
         .filter(p => p.state === 'alive')
         .sort((a,b) => b.score - a.score)
         .slice(0, 10)
         .map(p => ({ id: p.id, name: p.name, score: Math.floor(p.score), color: p.color }));
       
       updateUiState();
       lastUiUpdateRef.current = now;
    }
  });

  if (!gameState) return null;

  return (
    <>
      <ambientLight intensity={0.4} />
      
      <directionalLight
        ref={lightRef}
        target={lightTarget}
        castShadow
        intensity={2}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={0.1}
        shadow-camera-far={100}
        shadow-bias={-0.001}
      />
      <primitive object={lightTarget} />

      <mesh receiveShadow position={[0, 0, -0.2]}>
        <planeGeometry args={[WORLD_SIZE, WORLD_SIZE]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>

      <Grid
        position={[0, 0, -0.1]}
        rotation={[Math.PI / 2, 0, 0]}
        args={[WORLD_SIZE, WORLD_SIZE]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1e3a8a"
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#3b82f6"
        fadeDistance={100}
        fadeStrength={1}
      />

      <Orbs />

      {Object.values(gameState.players).map((player) => {
        if (player.state !== 'alive' || player.segments.length === 0) return null;
        return (
          <Snake
            key={player.id}
            playerId={player.id}
            color={player.color}
            isLocal={player.id === playerId}
          />
        );
      })}
    </>
  );
}
