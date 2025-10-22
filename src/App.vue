<script setup lang="ts">
import Phaser from 'phaser';
import { ref, type ComponentPublicInstance } from 'vue';
import type { MainMenu } from './game/scenes/MainMenu';
import PhaserGame from './PhaserGame.vue';

//  Typed reference to PhaserGame public instance (exposed props)
type PhaserGamePublic = ComponentPublicInstance<{
  scene: Phaser.Scene | null;
  game: Phaser.Game | null;
}>;

// The sprite can only be moved in the MainMenu Scene
const canMoveSprite = ref<boolean>(true);

//  References to the PhaserGame component (game and scene are exposed)
const phaserRef = ref<PhaserGamePublic | null>(null);
const spritePosition = ref<{ x: number; y: number }>({ x: 0, y: 0 });

const changeScene = () => {
  const scene = phaserRef.value?.scene as (MainMenu | null | undefined);
  if (scene && typeof (scene as any).changeScene === 'function') {
    scene.changeScene();
  }
};

const moveSprite = () => {
  const scene = phaserRef.value?.scene as (MainMenu | null | undefined);
  if (scene && typeof (scene as any).moveLogo === 'function') {
    scene.moveLogo(({ x, y }) => {
      spritePosition.value = { x, y };
    });
  }
};

const addSprite = () => {
  const scene = phaserRef.value?.scene as Phaser.Scene | null | undefined;
  if (scene) {
    const x = Phaser.Math.Between(64, scene.scale.width - 64);
    const y = Phaser.Math.Between(64, scene.scale.height - 64);
    const star = scene.add.sprite(x, y, 'star');
    scene.add.tween({
      targets: star,
      duration: 500 + Math.random() * 1000,
      alpha: 0,
      yoyo: true,
      repeat: -1
    });
  }
};

// Event emitted from the PhaserGame component
const currentScene = (scene: Phaser.Scene) => {
  canMoveSprite.value = (scene.scene.key !== 'MainMenu');
};

</script>

<template>
    <PhaserGame ref="phaserRef" @current-active-scene="currentScene" />
    <div>
        <div>
            <button class="button" @click="changeScene">Change Scene</button>
        </div>
        <div>
            <button :disabled="canMoveSprite" class="button" @click="moveSprite">Toggle Movement</button>
        </div>
        <div class="spritePosition">Sprite Position:
            <pre>{{ spritePosition }}</pre>
        </div>
        <div>
            <button class="button" @click="addSprite">Add New Sprite</button>
        </div>
    </div>
</template>
