import { EventBus } from '../EventBus';
import { Sfx } from '../audio/Sfx';
import { Scene } from 'phaser';
import { HeroKey, HeroStatsService } from '../core/Hero';
import { Hud } from '../ui/Hud';
import { EnemySpawner } from '../spawners/EnemySpawner';
import { CoinSpawner } from '../spawners/CoinSpawner';
import { PowerUpSpawner } from '../spawners/PowerUpSpawner';
import { BossController } from '../boss/BossController';
import { DoorController } from '../doors/DoorController';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    heroKey: HeroKey = 'hero_jump';
    levelIndex: number = 1;
    path: string = '';
    
    // Elementos del juego
    player!: Phaser.Physics.Arcade.Sprite;
    platforms!: Phaser.Physics.Arcade.StaticGroup;
    enemies!: Phaser.Physics.Arcade.Group;
    coins!: Phaser.Physics.Arcade.Group;
    powerUps!: Phaser.Physics.Arcade.Group;
    movingPlatforms!: Phaser.Physics.Arcade.StaticGroup;
    currentCarrier?: Phaser.Physics.Arcade.Image | null;
    movingPlatforms!: Phaser.Physics.Arcade.Group;
    cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    spaceKey!: Phaser.Input.Keyboard.Key;
    wasd!: { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; up: Phaser.Input.Keyboard.Key };
    
    // UI
    hud!: Hud;
    
    // Variables del juego
    score: number = 0;
    lives: number = 3;
    gameWon: boolean = false;
    speedX: number = 300;
    jumpV: number = -600;
    invincible: boolean = false;
    levelComplete: boolean = false;
    bossCtrl?: BossController;
    doorCtrl?: DoorController;
    totalCoins: number = 0;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x87CEEB); // Azul cielo
        this.camera.roundPixels = true; // Evitar sub-pixel blur en pixel art

        // Fondos parallax automáticos según nivel/ruta
        this.addParallaxBackground(this.getBackgroundPrefix());

        // Reset de estado de nivel al (re)entrar
        this.gameWon = false;
        this.levelComplete = false;
        this.invincible = false;
        try { this.doorCtrl = new DoorController(this); } catch {}
        try { this.bossCtrl?.dispose(); } catch {}
        this.bossCtrl = undefined;

        // Selección de héroe
        const sel = this.registry.get('selectedHero');
        if (sel && (sel === 'hero_speed' || sel === 'hero_jump' || sel === 'hero_tank')) {
            this.heroKey = sel;
        }

        // Estado de nivel y camino
        const idx = this.registry.get('levelIndex');
        this.levelIndex = typeof idx === 'number' ? idx : 1;
        const p = this.registry.get('path');
        this.path = typeof p === 'string' ? p : '';

        const stats = HeroStatsService.getStats(this.heroKey);
        this.speedX = stats.speedX;
        this.jumpV = stats.jumpV;
        this.lives = stats.lives;

        // Continuidad de puntuación/vidas después de aplicar stats base
        const carryScore = this.registry.get('carryScore');
        if (typeof carryScore === 'number') this.score = carryScore;
        const carryLives = this.registry.get('carryLives');
        if (typeof carryLives === 'number') this.lives = carryLives;

        // Crear plataformas
        this.createPlatforms();
        // Crear plataformas móviles
        this.createMovingPlatforms();
        
        // Crear jugador
        this.createPlayer();
        
        // Inicializar grupos
        this.enemies = this.physics.add.group();
        this.coins = this.physics.add.group();
        this.powerUps = this.physics.add.group();

        // Crear enemigos
        const enemySpawner = new EnemySpawner();
        enemySpawner.spawn(this, this.enemies, this.levelIndex, this.getPathChoice());
        
        // Crear monedas
        const coinSpawner = new CoinSpawner();
        coinSpawner.spawn(this, this.coins, this.levelIndex, this.getPathChoice(), this.platforms);
        this.totalCoins = this.coins.getChildren().length;

        // Crear power-ups
        const powerUpSpawner = new PowerUpSpawner();
        powerUpSpawner.spawn(this, this.powerUps);

        // Jefe en nivel 3
        if (this.levelIndex >= 3) {
            this.bossCtrl = new BossController(this);
            this.bossCtrl.start(this.platforms, this.player);
        }
        
        // Configurar controles (flechas + WASD) y capturas de teclado
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.input.keyboard!.addCapture(['UP','DOWN','LEFT','RIGHT','SPACE','W','A','S','D']);
        this.wasd = {
            left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W)
        };
        
        // Crear UI
        this.hud = new Hud(this, this.score, this.lives, this.totalCoins);
        // Texto de héroe y stats (arriba derecha)
        const heroLabel = HeroStatsService.getLabel(this.heroKey);
        const statsTxt = `VEL ${this.speedX} | SALTO ${Math.abs(this.jumpV)} | VIDAS ${this.lives}`;
        this.add.text(1024 - 16, 16, `Nivel: ${this.levelIndex}\nHéroe: ${heroLabel}\n${statsTxt}`, {
            fontSize: '20px',
            color: '#000',
            align: 'right'
        }).setOrigin(1, 0);
        
        // Configurar física
        this.setupPhysics();

        // Bridge boss controller overlap back to scene logic
        this.events.on('boss-hit-player', () => this.hitEnemy(this.player, null));

        EventBus.emit('current-scene-ready', this);
    }

    private addParallaxBackground(prefix: string)
    {
        const cx = 1024 / 2;
        const cy = 768 / 2;
        const has = (key: string) => this.textures.exists(key);
        const add = (suffix: string, sf: number, depth: number, alpha?: number) => {
            const key = `${prefix}${suffix}`;
            if (!has(key)) return null;
            const img = this.add.image(cx, cy, key).setScrollFactor(sf).setDepth(depth).setName(key);
            if (alpha !== undefined) img.setAlpha(alpha);
            return img as Phaser.GameObjects.Image | null;
        };

        // Orden típico del pack (ajusta valores si lo deseas)
        add('bg', 0.10, -50);
        add('mid', 0.25, -40);
        add('arches', 0.35, -35);
        add('coffins', 0.35, -35);
        add('crystals', 0.35, -35);
        add('lava', 0.35, -35);
        add('banners', 0.35, -35);
        add('lights', 0.40, -30);
        const fog = add('fog', 0.55, -25, 0.85);
        add('fg', 0.70, -20, 0.95);

        // Pulso sutil en la niebla si existe
        if (fog) {
            this.tweens.add({
                targets: fog,
                alpha: { from: 0.75, to: 0.9 },
                duration: 2400,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.inOut'
            });
        }
    }

    private getBackgroundPrefix(): string
    {
        // Sugerencias de mezcla por nivel
        // Nivel 1 (A/B): scene1_castle_corridor -> 's1_'
        // Nivel 2A: 's2_', 2B: 's5_'
        // Nivel 3A: 's4_', 3B: 's3_'
        if (this.levelIndex === 1) return 's1_';
        const choice = this.getPathChoice();
        if (this.levelIndex === 2) return choice === 'A' ? 's2_' : 's5_';
        // 3 o más: usar mapeo de jefe
        return choice === 'A' ? 's4_' : 's3_';
    }

    createPlatforms()
    {
        this.platforms = this.physics.add.staticGroup();
        
        // Plataforma base
        this.platforms.create(512, 768, 'platform').setScale(10, 1).refreshBody();

        const choice = this.getPathChoice();
        if (this.levelIndex === 1) {
            this.levelLayoutA();
        } else if (this.levelIndex === 2) {
            choice === 'A' ? this.levelLayoutA2() : this.levelLayoutB2();
        } else {
            choice === 'A' ? this.levelLayoutA3() : this.levelLayoutB3();
        }
    }

    createPlayer()
    {
        const sheet = HeroStatsService.getSheetKey(this.heroKey);
        this.player = this.physics.add.sprite(100, 700, sheet, 0);
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        this.player.setScale(1);
    }

    

    setupPhysics()
    {
        // Colisiones del jugador con plataformas
        this.physics.add.collider(this.player, this.platforms);
        // Colisiones del jugador con plataformas móviles (captura portador)
        if (this.movingPlatforms) {
            this.physics.add.collider(this.player, this.movingPlatforms, (_p: any, plat: any) => {
                this.currentCarrier = plat as any;
            });
        }
        
        // Colisiones de enemigos con plataformas
        this.physics.add.collider(this.enemies, this.platforms);
        if (this.movingPlatforms) {
            this.physics.add.collider(this.enemies, this.movingPlatforms);
        }
        
        // Las monedas NO colisionan con plataformas (flotan libremente)
        
        // Los power-ups flotan; no colisionan con plataformas
        
        // Colisión jugador con enemigos
        this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, undefined, this);
        
        // Colisión jugador con monedas
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, undefined, this);

        // Colisión jugador con power-ups
        this.physics.add.overlap(this.player, this.powerUps, this.collectPowerUp, undefined, this);

        // Proyectiles del jefe
        if (this.bossCtrl?.getProjectiles()) {
            const projs = this.bossCtrl.getProjectiles()!;
            this.physics.add.overlap(this.player, projs, this.hitEnemy, undefined, this);
            this.physics.add.collider(projs, this.platforms, (proj: any) => proj.destroy());
        }
    }

    update()
    {
        // Actualizar plataformas móviles (sinusoidal + refreshBody)
        this.updateMovingPlatforms();
        // Controles del jugador (flechas o WASD)
        const leftPressed = (this.cursors?.left?.isDown) || this.wasd?.left?.isDown;
        const rightPressed = (this.cursors?.right?.isDown) || this.wasd?.right?.isDown;
        if (leftPressed)
        {
            this.player.setVelocityX(-this.speedX);
            this.player.setFlipX(true);
        }
        else if (rightPressed)
        {
            this.player.setVelocityX(this.speedX);
            this.player.setFlipX(false);
        }
        else
        {
            this.player.setVelocityX(0);
        }

        if (this.player.body!.touching.down)
        {
            const upKey = this.cursors?.up;
            const wKey = this.wasd?.up;
            const space = this.spaceKey;
            if ((upKey && Phaser.Input.Keyboard.JustDown(upKey)) || (wKey && Phaser.Input.Keyboard.JustDown(wKey)) || Phaser.Input.Keyboard.JustDown(space))
            {
                this.player.setVelocityY(this.jumpV);
                Sfx.jump(this);
            }
        }
        
        // Animaciones: caminar / salto / idle
        const onGround = this.player.body!.touching.down;
        const vx = this.player.body!.velocity.x;
        const moving = Math.abs(vx) > 10 && onGround;

        const isSpeed = this.heroKey === 'hero_speed';
        const isTank = this.heroKey === 'hero_tank';
        const walkKey = isSpeed ? 'walk_speed' : isTank ? 'walk_tank' : 'walk_jump';
        const idleKey = isSpeed ? 'idle_speed' : isTank ? 'idle_tank' : 'idle_jump';
        const jumpKey = isSpeed ? 'jump_speed' : isTank ? 'jump_tank' : 'jump_jump';

        if (!onGround) {
            if (this.player.anims.currentAnim?.key !== jumpKey) {
                this.player.anims.play(jumpKey, true);
            }
        } else if (moving) {
            if (this.player.anims.currentAnim?.key !== walkKey) {
                this.player.anims.play(walkKey, true);
            }
        } else {
            if (this.player.anims.currentAnim?.key !== idleKey) {
                this.player.anims.play(idleKey, true);
            }
        }

        // Reiniciar si el jugador cae
        if (this.player.y > 800)
        {
            this.resetPlayerPosition();
        }

        // Flip horizontal de duendes según dirección de movimiento
        this.enemies.children.iterate((e: any) => {
            const s = e as Phaser.Physics.Arcade.Sprite;
            if (s.body) s.setFlipX((s.body as any).velocity.x < 0);
            return true;
        });
        
        // Verificar victoria (nunca más de una vez)
        if (this.coins.countActive(true) === 0 && !this.gameWon)
        {
            this.gameWon = true;

            // Bonus por completar el nivel
            this.score += 100;
            this.hud.updateScore(this.score);

            if (this.levelIndex >= 3)
            {
                // Fin de la partida tras el jefe
                this.registry.set('finalScore', this.score);
                this.add.text(512, 384, '¡GANASTE!', {
                    fontSize: '64px', color: '#00ff00', stroke: '#000000', strokeThickness: 4
                }).setOrigin(0.5);
                Sfx.win(this);
                this.time.delayedCall(2500, () => { this.scene.start('GameOver'); });
            }
            else
            {
                this.levelComplete = true;
                this.invincible = true;
                Sfx.win(this);
                this.add.text(512, 120, 'Elige una puerta', { fontSize: '40px', color: '#ffff00', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
                // Retrasar un frame para asegurar que colisionadores/plataformas estén listos
                this.time.delayedCall(50, () => {
                    if (!this.doorCtrl) this.doorCtrl = new DoorController(this);
                    this.doorCtrl.spawn(this.player, this.platforms, this.levelIndex, this.getPathChoice(), (choice) => this.enterDoor(choice));
                });
            }
        }

        // Arrastre por plataforma móvil bajo los pies (ayuda en X o bloqueo suave en Y)
        if (this.player.body!.touching.down && this.currentCarrier)
        {
            const img: any = this.currentCarrier;
            const dx = (img.getData && img.getData('dx')) ?? 0;
            const dy = (img.getData && img.getData('dy')) ?? 0;
            this.player.x += dx;
            this.player.y += dy;
        }
        // Reset para el siguiente frame; se fijará en el collider si aplica
        this.currentCarrier = null;
    }

    private floatText(x: number, y: number, msg: string, color = '#ffff00')
    {
        const t = this.add.text(x, y, msg, { fontSize: '20px', color, stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
        this.tweens.add({ targets: t, y: y - 30, alpha: 0, duration: 700, onComplete: () => t.destroy() });
    }

    collectPowerUp(_player: any, pu: any)
    {
        const type = pu.getData('ptype');
        const glow = pu.getData('glow');
        
        // Destruir el glow asociado
        if (glow && glow.active) {
            glow.destroy();
        }
        
        pu.disableBody(true, true);
        Sfx.powerUp(this);

        // mini destello donde estaba el power-up
        const flash = this.add.rectangle(pu.x, pu.y, 10, 10, 0xffffff, 0.9).setDepth(999);
        this.tweens.add({ targets: flash, scaleX: 6, scaleY: 6, alpha: 0, duration: 220, onComplete: () => flash.destroy() });

        switch (type) {
            case 'life':
                this.lives += 1;
                this.hud.updateLives(this.lives);
                this.floatText(pu.x, pu.y, '+1 Vida', '#2ecc71');
                break;
            case 'speed':
                this.floatText(pu.x, pu.y, 'Velocidad +', '#3498db');
                this.speedX = 450;
                this.jumpV = -700;
                this.player.setTint(0x3498db);
                // pulso corto en el player
                this.tweens.add({ targets: this.player, scaleX: 1.06, scaleY: 1.06, yoyo: true, duration: 120 });
                this.time.delayedCall(5000, () => {
                    this.speedX = 300;
                    this.jumpV = -600;
                    this.player.clearTint();
                });
                break;
            case 'inv':
                this.floatText(pu.x, pu.y, 'Invencible', '#f1c40f');
                this.invincible = true;
                this.player.setTint(0xf1c40f);
                // aura rápida
                const aura = this.add.circle(this.player.x, this.player.y, 22, 0xffff66, 0.2).setDepth(1).setBlendMode(Phaser.BlendModes.ADD);
                const follow = this.time.addEvent({ delay: 16, loop: true, callback: () => aura.setPosition(this.player.x, this.player.y) });
                this.tweens.add({ targets: aura, alpha: 0.35, yoyo: true, repeat: -1, duration: 300 });
                this.time.delayedCall(4000, () => {
                    this.invincible = false;
                    this.player.clearTint();
                    aura.destroy();
                    follow.remove(false);
                });
                break;
        }
    }

    createPowerUps()
    {
        this.powerUps = this.physics.add.group();

        const items = [
            { x: 500, y: 520, key: 'pu_speed_sheet', anim: 'pu_speed_idle', type: 'speed' },
            { x: 850, y: 370, key: 'pu_inv_sheet', anim: 'pu_inv_idle', type: 'inv' },
            { x: 150, y: 120, key: 'pu_life_sheet', anim: 'pu_life_idle', type: 'life' }
        ];

        items.forEach(i => {
            // Verificar textura
            const tex = this.textures.get(i.key);
            if (!tex || tex.key === '__MISSING') {
                console.error(`❌ Textura ${i.key} no encontrada`);
                return;
            }
            
            const pu = this.powerUps.create(i.x, i.y, i.key, 0) as Phaser.Physics.Arcade.Sprite;
            pu.play(i.anim);
            
            // Escala moderada y sin físicas que lo muevan
            pu.setScale(1.5);
            pu.setBounce(0);
            pu.setCollideWorldBounds(false);
            pu.setData('ptype', i.type);
            
            // Hitbox ajustada (sprites de 32x32 escalados a 2.0 = 64x64)
            pu.body!.setSize(20, 20).setOffset(2, 2);

            // Flotantes: sin gravedad ni empuje
            (pu.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
            pu.setImmovable(true);

            // Efecto de flotación pronunciado
            this.tweens.add({
                targets: pu,
                y: pu.y - 4,
                duration: 1100,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.inOut'
            });

            // Efecto de pulso muy sutil en la escala
            this.tweens.add({
                targets: pu,
                scaleX: 1.55,
                scaleY: 1.55,
                duration: 1200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.inOut'
            });

            // Añadir un glow circular pequeño y muy sutil detrás según el tipo
            let glowColor = 0xffffff;
            if (i.type === 'life') glowColor = 0xff6b9d; // Rosa/rojo para vida
            else if (i.type === 'speed') glowColor = 0x4fc3f7; // Azul cyan para velocidad
            else if (i.type === 'inv') glowColor = 0xffd700; // Dorado para invencibilidad

            const glow = this.add.circle(i.x, i.y, 14, glowColor, 0.12);
            glow.setDepth(pu.depth - 1);
            glow.setBlendMode(Phaser.BlendModes.ADD);

            // Pulso del glow muy sutil
            this.tweens.add({
                targets: glow,
                alpha: 0.2,
                scale: 1.1,
                duration: 1400,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.inOut'
            });

            // Vincular el glow al movimiento del power-up
            pu.setData('glow', glow);
            
            // Actualizar posición del glow en cada frame
            this.events.on('update', () => {
                if (pu.active && glow.active) {
                    glow.setPosition(pu.x, pu.y);
                }
            });
        });
        
        console.log(`⚡ Creados ${items.length} power-ups`);
    }

    collectCoin(_player: any, coin: any)
    {
        // Crear efecto de partículas en la posición de la moneda
        const particles = this.add.particles(coin.x, coin.y, 'coin_sheet', {
            speed: { min: 50, max: 100 },
            scale: { start: 0.5, end: 0 },
            lifespan: 300,
            quantity: 5
        });
        
        // Eliminar el efecto después de un tiempo
        this.time.delayedCall(300, () => {
            particles.destroy();
        });
        
        coin.disableBody(true, true);
        this.score += 10;
        this.hud.updateScore(this.score);
        
        // Actualizar contador de monedas
        const coinsRemaining = this.coins.countActive(true);
        const collected = this.totalCoins - coinsRemaining;
        this.hud.updateCoins(collected, this.totalCoins);

        Sfx.coin(this);

        // Reproducir animación de "pick"
        const pickKey = this.heroKey === 'hero_speed' ? 'pick_speed' :
                        this.heroKey === 'hero_tank' ? 'pick_tank' : 'pick_jump';
        const idleKey = this.heroKey === 'hero_speed' ? 'idle_speed' :
                        this.heroKey === 'hero_tank' ? 'idle_tank' : 'idle_jump';

        if (this.player.body!.touching.down) {
            this.player.anims.play(pickKey);
            this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                this.player.anims.play(idleKey, true);
            });
        }
    }

    hitEnemy(_player: any, _enemy: any)
    {
        if (this.invincible) {
            return;
        }
        Sfx.hit(this);
        // Efecto de vibración de la cámara
        this.cameras.main.shake(500, 0.02);
        
        // Efecto visual de daño (parpadeo del jugador)
        this.player.setTint(0xff0000);
        this.time.delayedCall(200, () => {
            this.player.clearTint();
        });
        
        this.lives--;
        this.hud.updateLives(this.lives);
        
        if (this.lives <= 0)
        {
            this.gameOver();
        }
        else
        {
            this.resetPlayerPosition();
        }
    }

    resetPlayerPosition()
    {
        this.player.setPosition(100, 700);
        this.player.setVelocity(0, 0);
    }

    gameOver()
    {
        // Guardar puntuación final
        this.registry.set('finalScore', this.score);

        Sfx.gameOver(this);

        this.add.text(512, 384, 'GAME OVER', {
            fontSize: '64px',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        this.time.delayedCall(3000, () => {
            this.scene.start('GameOver');
        });
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }

    private getPathChoice(): 'A' | 'B'
    {
        if (this.levelIndex === 1) return 'A';
        const idx = this.levelIndex - 2;
        const c = this.path.charAt(idx);
        return c === 'B' ? 'B' : 'A';
    }

    private levelLayoutA() {
        this.platforms.create(200, 650, 'platform').setScale(2, 1).refreshBody();
        this.platforms.create(500, 550, 'platform').setScale(2, 1).refreshBody();
        this.platforms.create(800, 450, 'platform').setScale(2, 1).refreshBody();
        this.platforms.create(200, 350, 'platform').setScale(2, 1).refreshBody();
        this.platforms.create(600, 250, 'platform').setScale(2, 1).refreshBody();
        this.platforms.create(100, 150, 'platform').setScale(1.5, 1).refreshBody();
        this.platforms.create(900, 150, 'platform').setScale(1.5, 1).refreshBody();
    }
    private levelLayoutA2() {
        this.platforms.create(220, 620, 'platform').setScale(2, 1).refreshBody();
        this.platforms.create(420, 520, 'platform').setScale(2, 1).refreshBody();
        this.platforms.create(680, 420, 'platform').setScale(2, 1).refreshBody();
        this.platforms.create(820, 320, 'platform').setScale(1.5, 1).refreshBody();
        this.platforms.create(512, 240, 'platform').setScale(2, 1).refreshBody();
        this.platforms.create(150, 180, 'platform').setScale(1.5, 1).refreshBody();
        this.platforms.create(900, 180, 'platform').setScale(1.5, 1).refreshBody();
    }
    private levelLayoutB2() {
        this.platforms.create(300, 600, 'platform').setScale(2, 1).refreshBody();
        this.platforms.create(520, 540, 'platform').setScale(2, 1).refreshBody();
        this.platforms.create(740, 480, 'platform').setScale(2, 1).refreshBody();
        this.platforms.create(900, 360, 'platform').setScale(1.5, 1).refreshBody();
        this.platforms.create(620, 260, 'platform').setScale(2, 1).refreshBody();
        this.platforms.create(420, 200, 'platform').setScale(1.5, 1).refreshBody();
        this.platforms.create(200, 160, 'platform').setScale(1.5, 1).refreshBody();
    }
    private levelLayoutA3() {
        this.platforms.create(250, 560, 'platform').setScale(2, 1).refreshBody();
        this.platforms.create(500, 460, 'platform').setScale(2, 1).refreshBody();
        this.platforms.create(750, 360, 'platform').setScale(2, 1).refreshBody();
        this.platforms.create(300, 260, 'platform').setScale(2, 1).refreshBody();
        this.platforms.create(600, 160, 'platform').setScale(2, 1).refreshBody();
        this.platforms.create(900, 160, 'platform').setScale(1.5, 1).refreshBody();
    }
    private levelLayoutB3() {
        this.platforms.create(200, 600, 'platform').setScale(2, 1).refreshBody();
        this.platforms.create(450, 520, 'platform').setScale(2, 1).refreshBody();
        this.platforms.create(700, 420, 'platform').setScale(2, 1).refreshBody();
        this.platforms.create(900, 300, 'platform').setScale(1.5, 1).refreshBody();
        this.platforms.create(550, 220, 'platform').setScale(2, 1).refreshBody();
        this.platforms.create(300, 180, 'platform').setScale(1.5, 1).refreshBody();
    }


    private enterDoor(choice: 'A' | 'B') {
        if (!this.levelComplete) return;
        const nextIndex = this.levelIndex + 1;
        const nextPath = this.path + choice;
        this.registry.set('levelIndex', nextIndex);
        this.registry.set('path', nextPath);
        this.registry.set('carryScore', this.score);
        this.registry.set('carryLives', this.lives);
        this.scene.restart();
    }
    
    private createMovingPlatforms()
    {
        this.movingPlatforms = this.physics.add.staticGroup();
        const choice = this.getPathChoice();

        const addPlatform = (x: number, y: number, axis: 'x' | 'y', range: number, periodMs: number, scaleX = 2, scaleY = 1) => {
            const p = this.physics.add.staticImage(x, y, 'platform');
            p.setScale(scaleX, scaleY);
            p.refreshBody();
            this.movingPlatforms.add(p);

            // Datos de movimiento sinusoidal
            p.setData('axis', axis);
            p.setData('baseX', x);
            p.setData('baseY', y);
            p.setData('range', range);
            p.setData('period', periodMs);
            p.setData('phase', Math.random() * Math.PI * 2);
            p.setData('prevX', x);
            p.setData('prevY', y);
            p.setData('dx', 0);
            p.setData('dy', 0);
        };

        if (this.levelIndex === 1)
        {
            // Ayuda en desplazamiento: horizontal (más sutil)
            addPlatform(500, 500, 'x', 140, 3200, 2, 1);
            // Bloqueo suave de salto: vertical de poco rango
            addPlatform(320, 380, 'y', 30, 1800, 1.5, 1);
        }
        else if (this.levelIndex === 2)
        {
            if (choice === 'A') {
                addPlatform(700, 420, 'x', 150, 3000, 2, 1);
                addPlatform(260, 300, 'y', 100, 3000, 1.5, 1);
            } else {
                addPlatform(820, 360, 'x', 160, 3200, 2, 1);
                addPlatform(360, 260, 'y', 110, 3200, 1.5, 1);
            }
        }
        else
        {
            addPlatform(300, 560, 'x', 160, 3200, 2, 1);
            addPlatform(780, 320, 'y', 120, 3200, 1.5, 1);
        }
    }

    private updateMovingPlatforms()
    {
        if (!this.movingPlatforms) return;
        const time = this.time.now; // ms
        this.movingPlatforms.children.iterate((c: any) => {
            const img = c as Phaser.Physics.Arcade.Image;
            const axis: 'x' | 'y' = img.getData('axis');
            const baseX: number = img.getData('baseX');
            const baseY: number = img.getData('baseY');
            const range: number = img.getData('range');
            const period: number = img.getData('period');
            const phase: number = img.getData('phase') ?? 0;
            const prevX: number = img.getData('prevX') ?? img.x;
            const prevY: number = img.getData('prevY') ?? img.y;

            const t = (time / period) * Math.PI * 2 + phase;
            const offset = Math.sin(t) * range;
            const newX = axis === 'x' ? baseX + offset : baseX;
            const newY = axis === 'y' ? baseY + offset : baseY;

            img.setPosition(newX, newY);
            img.refreshBody();

            const dx = newX - prevX;
            const dy = newY - prevY;
            img.setData('dx', dx);
            img.setData('dy', dy);
            img.setData('prevX', newX);
            img.setData('prevY', newY);
            return true;
        });
    }
    
}
