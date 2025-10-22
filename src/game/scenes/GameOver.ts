import { EventBus } from '../EventBus';
import { Sfx } from '../audio/Sfx';
import { Scene } from 'phaser';

export class GameOver extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameOverText : Phaser.GameObjects.Text;

    constructor ()
    {
        super('GameOver');
    }

    create ()
    {
        this.camera = this.cameras.main
        this.camera.setBackgroundColor(0x2c3e50);

        this.background = this.add.image(512, 384, 'background');
        this.background.setAlpha(0.3);

        this.gameOverText = this.add.text(512, 300, 'Fin del Juego', {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        // Mostrar puntuación final si está disponible
        const finalScore = this.registry.get('finalScore') || 0;
        this.add.text(512, 400, `Puntuación Final: ${finalScore}`, {
            fontFamily: 'Arial', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        // Botón para volver al menú
        this.add.text(512, 500, 'Haz clic para volver al menú', {
            fontFamily: 'Arial', fontSize: 24, color: '#ffff00',
            stroke: '#000000', strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        // Hacer la pantalla clickeable para volver al menú
        this.input.once('pointerdown', () => {
            Sfx.click(this);
            this.changeScene();
        });
        
        EventBus.emit('current-scene-ready', this);
    }

    changeScene ()
    {
        this.scene.start('MainMenu');
    }
}
