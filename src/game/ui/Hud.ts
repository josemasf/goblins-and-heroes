import { Scene } from 'phaser';

export interface IHUD {
  updateScore(score: number): void;
  updateLives(lives: number): void;
  updateCoins(collected: number, total: number): void;
  destroy(): void;
}

export class Hud implements IHUD {
  private scene: Scene;
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private coinsText!: Phaser.GameObjects.Text;

  constructor(scene: Scene, score: number, lives: number, totalCoins: number) {
    this.scene = scene;
    this.init(score, lives, totalCoins);
  }

  private init(score: number, lives: number, totalCoins: number) {
    this.scoreText = this.scene.add.text(16, 16, `Puntuación: ${score}`, {
      fontSize: '32px',
      color: '#000'
    });

    this.livesText = this.scene.add.text(16, 60, `Vidas: ${lives}`, {
      fontSize: '32px',
      color: '#000'
    });

    this.coinsText = this.scene.add.text(16, 104, `Monedas: 0/${totalCoins}`, {
      fontSize: '32px',
      color: '#000'
    });
  }

  updateScore(score: number): void {
    this.scoreText.setText(`Puntuación: ${score}`);
  }

  updateLives(lives: number): void {
    this.livesText.setText(`Vidas: ${lives}`);
  }

  updateCoins(collected: number, total: number): void {
    this.coinsText.setText(`Monedas: ${collected}/${total}`);
  }

  destroy(): void {
    this.scoreText?.destroy();
    this.livesText?.destroy();
    this.coinsText?.destroy();
  }
}

