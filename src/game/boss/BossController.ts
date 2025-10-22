import { Scene } from 'phaser';

export class BossController {
  private scene: Scene;
  private boss?: Phaser.Physics.Arcade.Sprite;
  private projectiles?: Phaser.Physics.Arcade.Group;
  private shootTimer?: Phaser.Time.TimerEvent;
  private teleportTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  getProjectiles(): Phaser.Physics.Arcade.Group | undefined {
    return this.projectiles;
  }

  getBoss(): Phaser.Physics.Arcade.Sprite | undefined {
    return this.boss;
  }

  start(platforms: Phaser.Physics.Arcade.StaticGroup, player: Phaser.Physics.Arcade.Sprite): void {
    const boss = this.scene.physics.add.sprite(700, 300, 'boss_troll_sheet', 0) as Phaser.Physics.Arcade.Sprite;
    this.boss = boss;
    boss.setCollideWorldBounds(true);
    boss.setScale(1.2);
    const body = boss.body as Phaser.Physics.Arcade.Body;
    // Ajustar hitbox para asegurar colisión robusta con plataformas
    body.setSize(48, 56, true);
    body.setBounce(0, 0);
    body.setMaxVelocity(400, 1000);
    this.scene.physics.add.collider(boss, platforms);
    this.scene.physics.add.overlap(player, boss, (_p: any, _b: any) => {
      // Delegate handling to scene via event to keep controller generic
      this.scene.events.emit('boss-hit-player');
    });
    boss.play('troll_idle');

    this.projectiles = this.scene.physics.add.group();

    this.shootTimer = this.scene.time.addEvent({
      delay: 1500,
      loop: true,
      callback: () => {
        if (!this.boss) return;
        boss.play('troll_cast');
        boss.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
          if (!this.boss || !this.projectiles) return;
          const proj = this.projectiles.create(boss.x, boss.y, 'projectile') as Phaser.Physics.Arcade.Image;
          const angle = Phaser.Math.Angle.Between(boss.x, boss.y, player.x, player.y);
          const speed = 220;
          proj.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
          boss.play('troll_idle');
        });
      }
    });

    this.teleportTimer = this.scene.time.addEvent({
      delay: 4000,
      loop: true,
      callback: () => {
        if (!this.boss) return;
        boss.play('troll_portal');
        boss.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
          if (!this.boss) return;
          const spots = [ {x: 250, y: 300}, {x: 750, y: 260}, {x: 500, y: 200} ];
          const s = Phaser.Utils.Array.GetRandom(spots);
          boss.setPosition(s.x, s.y);
          const b = boss.body as Phaser.Physics.Arcade.Body;
          // Resetear velocidad tras teletransporte para evitar atravesar por alta VY
          b.setVelocity(0, 0);
          this.scene.cameras.main.flash(150, 255, 255, 255);
          boss.play('troll_idle');
        });
      }
    });
  }

  dispose(): void {
    try { this.shootTimer?.remove(false); } catch {}
    try { this.teleportTimer?.remove(false); } catch {}
    try { this.projectiles?.destroy(true); } catch {}
    try { this.boss?.destroy(); } catch {}
    this.shootTimer = undefined;
    this.teleportTimer = undefined;
    this.projectiles = undefined;
    this.boss = undefined;
  }
}
