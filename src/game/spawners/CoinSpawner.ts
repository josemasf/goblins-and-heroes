import { Scene } from 'phaser';
import { getTopYForX } from '../utils/PlatformUtils';

export class CoinSpawner {
  spawn(
    scene: Scene,
    group: Phaser.Physics.Arcade.Group,
    levelIndex: number,
    pathChoice: 'A' | 'B',
    platforms: Phaser.Physics.Arcade.StaticGroup
  ): void {
    let coins: { x: number; y: number }[] = [];
    if (levelIndex === 1) {
      coins = [
        { x: 250, y: 600 }, { x: 550, y: 500 }, { x: 850, y: 400 },
        { x: 250, y: 300 }, { x: 650, y: 200 }, { x: 150, y: 100 },
        { x: 950, y: 100 }, { x: 512, y: 50 }
      ];
    } else if (levelIndex === 2) {
      coins = pathChoice === 'A'
        ? [
            { x: 200, y: 600 }, { x: 400, y: 520 }, { x: 680, y: 420 },
            { x: 820, y: 320 }, { x: 512, y: 240 }, { x: 150, y: 180 },
            { x: 900, y: 180 }, { x: 512, y: 80 }
          ]
        : [
            { x: 300, y: 580 }, { x: 520, y: 520 }, { x: 740, y: 460 },
            { x: 900, y: 360 }, { x: 620, y: 260 }, { x: 420, y: 200 },
            { x: 200, y: 160 }, { x: 850, y: 120 }
          ];
    } else {
      coins = pathChoice === 'A'
        ? [
            { x: 250, y: 560 }, { x: 500, y: 460 }, { x: 750, y: 360 },
            { x: 300, y: 260 }, { x: 600, y: 160 }, { x: 900, y: 160 },
            { x: 150, y: 120 }, { x: 512, y: 80 }
          ]
        : [
            { x: 200, y: 600 }, { x: 450, y: 520 }, { x: 700, y: 420 },
            { x: 900, y: 300 }, { x: 550, y: 220 }, { x: 300, y: 180 },
            { x: 150, y: 140 }, { x: 512, y: 100 }
          ];
    }

    coins.forEach((pos) => {
      const platformTop = getTopYForX(platforms, pos.x);
      const spawnY = Math.min(pos.y, platformTop - 24); // clampa sobre plataforma
      const coin = group.create(pos.x, spawnY, 'coin_sheet', 0) as Phaser.Physics.Arcade.Sprite;
      coin.play('coin_spin');
      coin.setScale(1);
      (coin.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      coin.setImmovable(true);
      coin.setBounce(0);
      coin.body!.setSize(20, 20).setOffset(2, 2);
      scene.tweens.add({ targets: coin, y: spawnY - 2, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.inOut' });
    });
  }
}
