import { Scene } from 'phaser';

export class DoorController {
  private scene: Scene;
  private doors?: Phaser.Physics.Arcade.StaticGroup;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  spawn(
    player: Phaser.Physics.Arcade.Sprite,
    platforms: Phaser.Physics.Arcade.StaticGroup,
    levelIndex: number,
    pathChoice: 'A' | 'B',
    onEnter: (choice: 'A' | 'B') => void
  ): void {
    if (this.doors && this.doors.getChildren().length > 0) return;
    this.doors = this.scene.physics.add.staticGroup();

    const [xA, xB] = this.getDoorXs(levelIndex, pathChoice);
    const yA = this.getDoorYForX(platforms, xA);
    const yB = this.getDoorYForX(platforms, xB);

    const doorA = this.doors.create(xA, yA, 'door') as Phaser.Physics.Arcade.Image;
    const doorB = this.doors.create(xB, yB, 'door') as Phaser.Physics.Arcade.Image;
    doorA.setDepth(80);
    doorB.setDepth(80);

    const glowA = this.scene.add.image(xA, yA - 10, 'door_glow').setDepth(70).setAlpha(0.7);
    glowA.setBlendMode(Phaser.BlendModes.ADD);
    const glowB = this.scene.add.image(xB, yB - 10, 'door_glow').setDepth(70).setAlpha(0.7);
    glowB.setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({ targets: [glowA, glowB], alpha: 0.4, yoyo: true, repeat: -1, duration: 700 });

    const arrowA = this.scene.add.image(xA, yA - 40, 'door_arrow').setDepth(90);
    const arrowB = this.scene.add.image(xB, yB - 40, 'door_arrow').setDepth(90);
    this.scene.tweens.add({ targets: [arrowA, arrowB], y: '+=8', yoyo: true, repeat: -1, duration: 500, ease: 'Sine.easeInOut' });

    this.scene.physics.add.overlap(player, doorA, () => onEnter('A'));
    this.scene.physics.add.overlap(player, doorB, () => onEnter('B'));
  }

  private getDoorXs(level: number, choice: 'A' | 'B'): [number, number] {
    if (level === 1) return [100, 900];
    if (level === 2) return choice === 'A' ? [420, 820] : [520, 900];
    return [300, 740];
  }

  private getDoorYForX(platforms: Phaser.Physics.Arcade.StaticGroup, x: number): number {
    let y = 420;
    const children = platforms.getChildren() as any[];
    children.forEach((obj: any) => {
      if (!obj || typeof obj.x !== 'number' || typeof obj.y !== 'number') return;
      const w = (obj.displayWidth ?? 100);
      const h = (obj.displayHeight ?? 20);
      const halfW = w / 2;
      if (x >= obj.x - halfW && x <= obj.x + halfW) {
        const top = obj.y - h / 2;
        const candidate = top - 24;
        if (candidate < y) y = candidate;
      }
    });
    return y;
  }
}

