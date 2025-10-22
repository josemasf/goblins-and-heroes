import { Scene } from 'phaser';

export class EnemySpawner {
  spawn(
    _scene: Scene,
    group: Phaser.Physics.Arcade.Group,
    levelIndex: number,
    pathChoice: 'A' | 'B'
  ): void {
    let positions: { x: number; y: number }[] = [];
    if (levelIndex === 1) {
      positions = [
        { x: 500, y: 500 },
        { x: 800, y: 400 },
        { x: 200, y: 300 },
        { x: 600, y: 200 }
      ];
    } else if (levelIndex === 2) {
      positions = pathChoice === 'A'
        ? [ { x: 300, y: 520 }, { x: 700, y: 420 } ]
        : [ { x: 200, y: 480 }, { x: 850, y: 280 }, { x: 500, y: 360 } ];
    } else {
      positions = pathChoice === 'A'
        ? [ { x: 250, y: 500 }, { x: 750, y: 300 } ]
        : [ { x: 400, y: 520 }, { x: 900, y: 380 } ];
    }

    positions.forEach((pos, idx) => {
      const key = (idx % 2 === 0) ? 'goblin_green_sheet' : 'goblin_red_sheet';
      const gob = group.create(pos.x, pos.y, key, 0) as Phaser.Physics.Arcade.Sprite;
      gob.setBounce(1).setCollideWorldBounds(true);
      gob.setVelocity(Phaser.Math.Between(-200, 200), 0);
      gob.setScale(1.5);
      gob.body!.setSize(20, 26).setOffset(6, 6);
      gob.play('goblin_run');
    });
  }
}
