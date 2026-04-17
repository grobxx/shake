/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { GameScene } from './components/GameScene';
import { useGameStore } from './store/gameStore';
import { UI } from './components/UI';
import { initYandex } from './shared/yandex';

export default function App() {
  const { initializeLocalGame, setLanguage } = useGameStore();

  useEffect(() => {
    initializeLocalGame();
    initYandex().then(ysdk => {
      if (ysdk) {
        const lang = ysdk.environment.i18n.lang;
        if (['ru', 'be', 'kk', 'uk', 'uz'].includes(lang)) {
          setLanguage('ru');
        } else {
          setLanguage('en');
        }
      }
    });
  }, [initializeLocalGame, setLanguage]);

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      <Canvas
        shadows
        camera={{ position: [0, 0, 50], fov: 60 }}
        gl={{ antialias: false }}
      >
        <color attach="background" args={['#050505']} />
        <GameScene />
        <EffectComposer>
          <Bloom
            luminanceThreshold={1.5}
            mipmapBlur
            intensity={1.5}
          />
        </EffectComposer>
      </Canvas>
      <UI />
    </div>
  );
}
