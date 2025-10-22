import { Scene } from 'phaser';
import { Sfx } from '../audio/Sfx';

export class LevelSelectDev extends Scene {
  constructor() {
    super('LevelSelectDev');
  }

  create() {
    this.add.text(512, 120, 'DEV: Seleccionar Nivel', {
      fontFamily: 'Arial Black', fontSize: 48, color: '#ffff00',
      stroke: '#000000', strokeThickness: 8, align: 'center'
    }).setOrigin(0.5);

    const options: { label: string; level: number; path: string }[] = [
      { label: 'Nivel 1', level: 1, path: '' },
      { label: 'Nivel 2A', level: 2, path: 'A' },
      { label: 'Nivel 2B', level: 2, path: 'B' },
      { label: 'Nivel 3A', level: 3, path: 'AA' },
      { label: 'Nivel 3B', level: 3, path: 'AB' }
    ];

    const startX = 240;
    const y = 300;
    const gap = 150;

    options.forEach((opt, i) => {
      const x = startX + (i % 3) * gap;
      const rowY = y + Math.floor(i / 3) * 120;
      const btn = this.add.text(x, rowY, opt.label, {
        fontFamily: 'Arial Black', fontSize: 32, color: '#00ff00', stroke: '#000000', strokeThickness: 6
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        Sfx.click(this);
        this.registry.set('levelIndex', opt.level);
        this.registry.set('path', opt.path);
        this.registry.set('carryScore', 0);
        this.registry.set('carryLives', undefined);
        this.scene.start('Game');
      });
    });

    // Volver al menú
    const back = this.add.text(512, 600, 'Volver al Menú', {
      fontFamily: 'Arial', fontSize: 24, color: '#ffff00', stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => {
      Sfx.click(this);
      this.scene.start('MainMenu');
    });
  }
}

