<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { EventBus } from './game/EventBus';
import StartGame from './game/main';
import Phaser from 'phaser';

// Typed references to current Phaser instances
const scene = ref<Phaser.Scene | null>(null);
const game = ref<Phaser.Game | null>(null);

const emit = defineEmits<{
  (e: 'current-active-scene', scene: Phaser.Scene): void
}>();

onMounted(() => {
  game.value = StartGame('game-container');

  EventBus.on('current-scene-ready', (sceneInstance: Phaser.Scene) => {
    emit('current-active-scene', sceneInstance);
    scene.value = sceneInstance;
  });
});

onUnmounted(() => {
  if (game.value) {
    game.value.destroy(true);
    game.value = null;
  }
});

// Expose raw values (not Refs) for parent consumers
defineExpose({
  get scene() {
    return scene.value;
  },
  get game() {
    return game.value;
  }
});

</script>

<template>
    <div id="game-container"></div>
</template>
