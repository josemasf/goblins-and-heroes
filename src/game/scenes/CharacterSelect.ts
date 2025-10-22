import { Scene, GameObjects } from 'phaser';
import { EventBus } from '../EventBus';
import { Sfx } from '../audio/Sfx';

type HeroKey = 'hero_speed' | 'hero_jump' | 'hero_tank';

export class CharacterSelect extends Scene {
  background!: GameObjects.Image;
  title!: GameObjects.Text;
  selected: HeroKey = 'hero_jump';
  frames: Phaser.GameObjects.Rectangle[] = [];
  imgs: Phaser.GameObjects.Image[] = [];
  info!: Phaser.GameObjects.Text;
  confirmBtn!: Phaser.GameObjects.Text;
  backBtn!: Phaser.GameObjects.Text;

  constructor() {
    super('CharacterSelect');
  }

  create() {
    this.background = this.add.image(512, 384, 'background');

    this.title = this.add.text(512, 120, 'Selecciona tu héroe', {
      fontFamily: 'Arial Black', fontSize: 48, color: '#ffffff',
      stroke: '#000000', strokeThickness: 8, align: 'center'
    }).setOrigin(0.5).setDepth(100);

    try {
      const saved = window.localStorage.getItem('selectedHero') as HeroKey | null;
      if (saved) this.selected = saved;
    } catch {}

    this.layoutHeroes();
    this.updateInfo();

    this.confirmBtn = this.add.text(512, 650, 'Confirmar', {
      fontFamily: 'Arial Black', fontSize: 36, color: '#00ff00', stroke: '#000000', strokeThickness: 6
    }).setOrigin(0.5).setDepth(100).setInteractive({ useHandCursor: true });
    this.confirmBtn.on('pointerdown', () => {
      Sfx.click(this);
      this.registry.set('selectedHero', this.selected);
      // Reset de progreso de niveles al iniciar una nueva partida
      this.registry.set('levelIndex', 1);
      this.registry.set('path', '');
      this.registry.set('carryScore', 0);
      this.registry.set('carryLives', undefined);
      try { window.localStorage.setItem('selectedHero', this.selected); } catch {}
      this.scene.start('Game');
    });

    this.backBtn = this.add.text(100, 720, '← Volver', {
      fontFamily: 'Arial', fontSize: 24, color: '#ffff00', stroke: '#000000', strokeThickness: 4
    }).setOrigin(0, 1).setDepth(100).setInteractive({ useHandCursor: true });
    this.backBtn.on('pointerdown', () => {
      Sfx.click(this);
      this.scene.start('MainMenu');
    });

    EventBus.emit('current-scene-ready', this);
  }

  private layoutHeroes() {
    const defs: { key: HeroKey; sheet: string; label: string }[] = [
      { key: 'hero_speed', sheet: 'hero_speed_sheet', label: 'Velocidad' },
      { key: 'hero_jump', sheet: 'hero_jump_sheet', label: 'Salto' },
      { key: 'hero_tank', sheet: 'hero_tank_sheet', label: 'Tanque' }
    ];
    const startX = 260;
    const y = 360;
    const gap = 260;

    defs.forEach((h, i) => {
      const x = startX + i * gap;
      const frame = this.add.rectangle(x, y, 120, 120).setStrokeStyle(6, 0xffffff).setDepth(90);
      const img = this.add.image(x, y - 10, h.sheet, 0).setScale(3).setInteractive({ useHandCursor: true }).setDepth(100);
      this.add.text(x, y + 70, h.label, { fontFamily: 'Arial Black', fontSize: 22, color: '#ffffff', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setDepth(100);

      img.on('pointerdown', () => {
        Sfx.click(this);
        this.selected = h.key;
        try { window.localStorage.setItem('selectedHero', this.selected); } catch {}
        this.updateFrames();
        this.updateInfo();
      });

      this.frames.push(frame);
      this.imgs.push(img);
    });

    this.updateFrames();
  }

  private updateFrames() {
    const order: HeroKey[] = ['hero_speed', 'hero_jump', 'hero_tank'];
    this.frames.forEach((f, idx) => {
      const active = order[idx] === this.selected;
      f.setStrokeStyle(6, active ? 0xffff00 : 0xffffff);
    });
  }

  private updateInfo() {
    const map: Record<HeroKey, { name: string; desc: string; stats: string }> = {
      hero_speed: {
        name: 'Velocidad',
        desc: 'Se mueve más rápido, pero con menos vidas.',
        stats: 'Velocidad: Alta | Salto: Medio | Vidas: 2'
      },
      hero_jump: {
        name: 'Salto',
        desc: 'Mayor altura de salto y balance general.',
        stats: 'Velocidad: Media | Salto: Alto | Vidas: 3'
      },
      hero_tank: {
        name: 'Tanque',
        desc: 'Más resistencia con más vidas, menor velocidad.',
        stats: 'Velocidad: Baja | Salto: Medio | Vidas: 4'
      }
    };
    const i = map[this.selected];
    if (!this.info) {
      this.info = this.add.text(512, 500, `${i.name}\n${i.desc}\n${i.stats}`, {
        fontFamily: 'Arial', fontSize: 22, color: '#ffffff', stroke: '#000000', strokeThickness: 4, align: 'center'
      }).setOrigin(0.5).setDepth(100);
    } else {
      this.info.setText(`${i.name}\n${i.desc}\n${i.stats}`);
    }
  }
}
