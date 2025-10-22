import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 384, 'background');

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress: number) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');

        this.load.image('logo', 'logo.png');
        this.load.image('star', 'star.png');
        this.load.image('intro', 'intro.png');
        
        // Cargar spritesheets de héroes
        this.load.spritesheet('hero_speed_sheet', 'hero_speed_sheet.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('hero_jump_sheet', 'hero_jump_sheet.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('hero_tank_sheet', 'hero_tank_sheet.png', { frameWidth: 32, frameHeight: 32 });

        // Cargar spritesheets de enemigos y jefe
        this.load.spritesheet('goblin_green_sheet', 'goblin_green_sheet.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('goblin_red_sheet', 'goblin_red_sheet.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('boss_troll_sheet', 'boss_troll_sheet.png', { frameWidth: 64, frameHeight: 64 });

        // Cargar spritesheets de monedas y power-ups
        // Formato unificado: 8×3 grid de 32×32 por celda = 256×96 total
        // 8 frames de animación en la primera fila (frames 0-7)
        // Las filas 2 y 3 están transparentes (frames 8-23)
        
        this.load.spritesheet('coin_sheet', 'coin_sheet_like_hero.png', { 
            frameWidth: 32, 
            frameHeight: 32 
        });
        
        this.load.spritesheet('pu_life_sheet', 'pu_life_sheet_like_hero.png', { 
            frameWidth: 32, 
            frameHeight: 32 
        });
        
        this.load.spritesheet('pu_speed_sheet', 'pu_speed_sheet_like_hero.png', { 
            frameWidth: 32, 
            frameHeight: 32 
        });
        
        this.load.spritesheet('pu_inv_sheet', 'pu_inv_sheet_like_hero.png', { 
            frameWidth: 32, 
            frameHeight: 32 
        });

        // Event listener para verificar carga exitosa
        this.load.on('filecomplete', (key: string) => {
            if (key.includes('coin_sheet') || key.includes('pu_')) {
                console.log(`✅ Cargado: ${key}`);
                const tex = this.textures.get(key);
                if (tex) {
                    console.log(`   Dimensiones: ${tex.source[0].width}x${tex.source[0].height}`);
                }
            }
        });
        
        // Crear sprites proceduralmente para el juego de plataformas (player/platform/enemy/doors)
        this.createPlayerSprite();
        this.createPlatformSprite();
        this.createEnemySprite();
        // Monedas y power-ups vendrán de spritesheets — no generamos aquí
        this.createDoorAndBossSprites();
    }

    createPlayerSprite()
    {
        // Crear un sprite del jugador (cuadrado azul)
        const graphics = this.add.graphics();
        graphics.fillStyle(0x3498db);
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture('player', 32, 32);
        graphics.destroy();
    }

    createPlatformSprite()
    {
        // Crear sprite de plataforma (rectángulo marrón)
        const graphics = this.add.graphics();
        graphics.fillStyle(0x8B4513);
        graphics.fillRect(0, 0, 100, 20);
        graphics.generateTexture('platform', 100, 20);
        graphics.destroy();
    }

    createEnemySprite()
    {
        // Crear sprite de enemigo (círculo rojo)
        const graphics = this.add.graphics();
        graphics.fillStyle(0xe74c3c);
        graphics.fillCircle(16, 16, 16);
        graphics.generateTexture('enemy', 32, 32);
        graphics.destroy();
    }

    createCoinSprite() { /* no-op, usamos spritesheet */ }
    createPowerUpSprites() { /* no-op, usamos spritesheet */ }

    createDoorAndBossSprites()
    {
        // Puerta (marrón con marco claro)
        let g = this.add.graphics();
        g.fillStyle(0x8B4513);
        g.fillRect(0, 0, 32, 48);
        g.lineStyle(3, 0xdeb887);
        g.strokeRect(0, 0, 32, 48);
        g.fillStyle(0x3e2723); g.fillRect(10, 20, 12, 12); // pomo
        g.generateTexture('door', 32, 48);
        g.destroy();

        // Proyectil (orbe morado)
        g = this.add.graphics();
        g.fillStyle(0x8e44ad); g.fillCircle(6, 6, 6);
        g.lineStyle(2, 0xffffff); g.strokeCircle(6, 6, 6);
        g.generateTexture('projectile', 12, 12);
        g.destroy();

        // Jefe (enemigo grande)
        g = this.add.graphics();
        g.fillStyle(0xc0392b);
        g.fillCircle(32, 32, 32);
        g.lineStyle(4, 0x000000); g.strokeCircle(32, 32, 32);
        g.generateTexture('boss', 64, 64);
        g.destroy();

        // Glow de puerta (círculo amarillo con alpha)
        g = this.add.graphics();
        for (let r = 44; r >= 16; r -= 8) {
            const alpha = (r - 12) / 44 * 0.25;
            g.fillStyle(0xfff176, alpha);
            g.fillCircle(48, 48, r);
        }
        g.generateTexture('door_glow', 96, 96);
        g.destroy();

        // Flecha guía (triángulo)
        g = this.add.graphics();
        g.fillStyle(0xffff00, 1);
        g.fillTriangle(12, 24, 24, 24, 18, 8);
        g.lineStyle(2, 0x000000, 0.8);
        g.strokeTriangle(12, 24, 24, 24, 18, 8);
        g.generateTexture('door_arrow', 36, 32);
        g.destroy();
    }

    createHeroSprites()
    {
        // Función eliminada - ahora usamos spritesheets desde assets
    }

    create ()
    {
        // Definir animaciones para cada héroe desde las spritesheets
        
        // SPEED
        this.anims.create({ key: 'idle_speed', frames: this.anims.generateFrameNumbers('hero_speed_sheet', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
        this.anims.create({ key: 'walk_speed', frames: this.anims.generateFrameNumbers('hero_speed_sheet', { start: 4, end: 9 }), frameRate: 12, repeat: -1 });
        this.anims.create({ key: 'jump_speed', frames: this.anims.generateFrameNumbers('hero_speed_sheet', { start: 10, end: 12 }), frameRate: 8, repeat: 0 });
        this.anims.create({ key: 'pick_speed', frames: this.anims.generateFrameNumbers('hero_speed_sheet', { start: 13, end: 16 }), frameRate: 10, repeat: 0 });

        // JUMP
        this.anims.create({ key: 'idle_jump', frames: this.anims.generateFrameNumbers('hero_jump_sheet', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
        this.anims.create({ key: 'walk_jump', frames: this.anims.generateFrameNumbers('hero_jump_sheet', { start: 4, end: 9 }), frameRate: 12, repeat: -1 });
        this.anims.create({ key: 'jump_jump', frames: this.anims.generateFrameNumbers('hero_jump_sheet', { start: 10, end: 12 }), frameRate: 8, repeat: 0 });
        this.anims.create({ key: 'pick_jump', frames: this.anims.generateFrameNumbers('hero_jump_sheet', { start: 13, end: 16 }), frameRate: 10, repeat: 0 });

        // TANK
        this.anims.create({ key: 'idle_tank', frames: this.anims.generateFrameNumbers('hero_tank_sheet', { start: 0, end: 3 }), frameRate: 5, repeat: -1 });
        this.anims.create({ key: 'walk_tank', frames: this.anims.generateFrameNumbers('hero_tank_sheet', { start: 4, end: 9 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'jump_tank', frames: this.anims.generateFrameNumbers('hero_tank_sheet', { start: 10, end: 12 }), frameRate: 6, repeat: 0 });
        this.anims.create({ key: 'pick_tank', frames: this.anims.generateFrameNumbers('hero_tank_sheet', { start: 13, end: 16 }), frameRate: 8, repeat: 0 });

        // GOBLINS (verde y rojo comparten animaciones)
        this.anims.create({ key: 'goblin_idle', frames: this.anims.generateFrameNumbers('goblin_green_sheet', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
        this.anims.create({ key: 'goblin_run', frames: this.anims.generateFrameNumbers('goblin_green_sheet', { start: 4, end: 9 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'goblin_atk', frames: this.anims.generateFrameNumbers('goblin_green_sheet', { start: 10, end: 12 }), frameRate: 8, repeat: 0 });
        this.anims.create({ key: 'goblin_hit', frames: this.anims.generateFrameNumbers('goblin_green_sheet', { start: 13, end: 16 }), frameRate: 10, repeat: 0 });

        // TROLL (jefe)
        this.anims.create({ key: 'troll_idle', frames: this.anims.generateFrameNumbers('boss_troll_sheet', { start: 0, end: 3 }), frameRate: 5, repeat: -1 });
        this.anims.create({ key: 'troll_run', frames: this.anims.generateFrameNumbers('boss_troll_sheet', { start: 4, end: 9 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'troll_cast', frames: this.anims.generateFrameNumbers('boss_troll_sheet', { start: 10, end: 12 }), frameRate: 8, repeat: 0 });
        this.anims.create({ key: 'troll_portal', frames: this.anims.generateFrameNumbers('boss_troll_sheet', { start: 13, end: 16 }), frameRate: 10, repeat: 0 });

        // MONEDA: animación de giro (8 frames de la fila 0)
        this.anims.create({ 
            key: 'coin_spin', 
            frames: this.anims.generateFrameNumbers('coin_sheet', { start: 0, end: 7 }), 
            frameRate: 12, 
            repeat: -1 
        });

        // POWER-UPS: pulso suave (8 frames de la fila 0)
        this.anims.create({ 
            key: 'pu_life_idle', 
            frames: this.anims.generateFrameNumbers('pu_life_sheet', { start: 0, end: 7 }), 
            frameRate: 6, 
            repeat: -1 
        });
        
        this.anims.create({ 
            key: 'pu_speed_idle', 
            frames: this.anims.generateFrameNumbers('pu_speed_sheet', { start: 0, end: 7 }), 
            frameRate: 12, 
            repeat: -1 
        });
        
        this.anims.create({ 
            key: 'pu_inv_idle', 
            frames: this.anims.generateFrameNumbers('pu_inv_sheet', { start: 0, end: 7 }), 
            frameRate: 8, 
            repeat: -1 
        });

        // Forzar filtro NEAREST en TODAS las texturas pixel art (Phaser 3.60+)
        const allSheets = [
            'coin_sheet', 'pu_life_sheet', 'pu_speed_sheet', 'pu_inv_sheet',
            'hero_speed_sheet', 'hero_jump_sheet', 'hero_tank_sheet',
            'goblin_green_sheet', 'goblin_red_sheet', 'boss_troll_sheet'
        ];
        allSheets.forEach(k => {
            const texture = this.textures.get(k);
            if (texture && texture.key !== '__MISSING') {
                texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
            } else {
                console.warn(`Textura "${k}" no encontrada o no cargada correctamente`);
            }
        });

        //  Mover al menú principal
        this.scene.start('MainMenu');
    }
}
