import { Scene } from 'phaser';

export class PowerUpSpawner {
  spawn(scene: Scene, group: Phaser.Physics.Arcade.Group): void {
    const items = [
      { x: 500, y: 520, key: 'pu_speed_sheet', anim: 'pu_speed_idle', type: 'speed' },
      { x: 850, y: 370, key: 'pu_inv_sheet', anim: 'pu_inv_idle', type: 'inv' },
      { x: 150, y: 120, key: 'pu_life_sheet', anim: 'pu_life_idle', type: 'life' }
    ];

    items.forEach(i => {
      const tex = scene.textures.get(i.key);
      if (!tex || tex.key === '__MISSING') {
        console.error(`Textura ${i.key} no encontrada`);
        return;
      }

      const pu = group.create(i.x, i.y, i.key, 0) as Phaser.Physics.Arcade.Sprite;
      pu.play(i.anim);
      pu.setScale(1.5);
      pu.setBounce(0);
      pu.setCollideWorldBounds(false);
      pu.setData('ptype', i.type);
      pu.body!.setSize(20, 20).setOffset(2, 2);
      (pu.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      pu.setImmovable(true);

      scene.tweens.add({ targets: pu, y: pu.y - 4, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      scene.tweens.add({ targets: pu, scaleX: 1.55, scaleY: 1.55, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

      let glowColor = 0xffffff;
      if (i.type === 'life') glowColor = 0xff6b9d;
      else if (i.type === 'speed') glowColor = 0x4fc3f7;
      else if (i.type === 'inv') glowColor = 0xffd700;

      const glow = scene.add.circle(i.x, i.y, 14, glowColor, 0.12);
      glow.setDepth(pu.depth - 1);
      glow.setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: glow, alpha: 0.2, scale: 1.1, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      pu.setData('glow', glow);

      scene.events.on('update', () => {
        if (pu.active && glow.active) {
          glow.setPosition(pu.x, pu.y);
        }
      });
    });

    console.log(`Creados ${items.length} power-ups`);
  }
}

