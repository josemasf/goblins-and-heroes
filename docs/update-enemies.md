# Integración en tu proyecto (quirúrgica y sin dramas)

Tu proyecto hoy crea enemigos con la textura `'enemy'` (círculo) y el jefe con `'boss'` (círculo grande), y dispara proyectiles `'projectile'`. Vamos a sustituirlos por las hojas y reproducir animaciones sin romper tu IA ni la lógica de timers.  

## 1) Mueve los PNG

Pon los 3 archivos en `public/assets/`. El loader ya hace `this.load.setPath('assets')` en `Preloader`. 

## 2) `Preloader.ts`

### a) Carga nuevas hojas (en `preload()`)

```ts
this.load.spritesheet('goblin_green_sheet', 'assets/goblin_green_sheet.png', { frameWidth: 32, frameHeight: 32 });
this.load.spritesheet('goblin_red_sheet',   'assets/goblin_red_sheet.png',   { frameWidth: 32, frameHeight: 32 });
this.load.spritesheet('boss_troll_sheet',   'assets/boss_troll_sheet.png',   { frameWidth: 64, frameHeight: 64 });
```

### b) Crea animaciones (en `create()`)

```ts
// Duendes (comparten claves con prefijo para no colisionar)
this.anims.create({ key:'goblin_idle', frames: this.anims.generateFrameNumbers('goblin_green_sheet',{start:0,end:3}), frameRate:6, repeat:-1 });
this.anims.create({ key:'goblin_run',  frames: this.anims.generateFrameNumbers('goblin_green_sheet',{start:4,end:9}), frameRate:10, repeat:-1 });
this.anims.create({ key:'goblin_atk',  frames: this.anims.generateFrameNumbers('goblin_green_sheet',{start:10,end:12}), frameRate:8, repeat:0  });
this.anims.create({ key:'goblin_hit',  frames: this.anims.generateFrameNumbers('goblin_green_sheet',{start:13,end:16}), frameRate:10, repeat:0  });

// Variante roja reusa las mismas keys via 'sheet' alterno cuando la creemos

// Jefe Trol
this.anims.create({ key:'troll_idle',   frames: this.anims.generateFrameNumbers('boss_troll_sheet',{start:0,end:3}),  frameRate:5,  repeat:-1 });
this.anims.create({ key:'troll_run',    frames: this.anims.generateFrameNumbers('boss_troll_sheet',{start:4,end:9}),  frameRate:8,  repeat:-1 });
this.anims.create({ key:'troll_cast',   frames: this.anims.generateFrameNumbers('boss_troll_sheet',{start:10,end:12}), frameRate:8,  repeat:0  });
this.anims.create({ key:'troll_portal', frames: this.anims.generateFrameNumbers('boss_troll_sheet',{start:13,end:16}), frameRate:10, repeat:0  });
```

> Ojo: mantenemos tus cargas existentes (plataformas, monedas, projectile, puertas, etc.). 

---

## 3) `Game.ts` — Enemigos (duendes)

Hoy instancias enemigos con `this.enemies.create(pos.x, pos.y, 'enemy')` y los haces rebotar con velocidad horizontal random. Vamos a usar **Sprite** con sheet y anim **run**, más flip por dirección.  

```ts
createEnemies() {
  this.enemies = this.physics.add.group();

  // ... tu lógica de posiciones se queda igual

  enemyPositions.forEach((pos, idx) => {
    // Alterna verde/rojo para variedad
    const key = (idx % 2 === 0) ? 'goblin_green_sheet' : 'goblin_red_sheet';
    const gob = this.enemies.create(pos.x, pos.y, key, 0) as Phaser.Physics.Arcade.Sprite;

    gob.setBounce(1).setCollideWorldBounds(true);
    gob.setVelocity(Phaser.Math.Between(-200, 200), 0);

    // Caja un pelín más estrecha que el 32x32
    gob.body.setSize(20, 26).setOffset(6, 6);

    gob.play('goblin_run');
  });
}
```

En tu `update()` añade esto para el **flip** de los duendes según dirección (no cambia IA, solo estética):

```ts
this.enemies.children.iterate((e: any) => {
  const s = e as Phaser.Physics.Arcade.Sprite;
  if (s.body) s.setFlipX((s.body as any).velocity.x < 0);
});
```

> Si quieres que, al colisionar con el jugador, el duende haga un “hit”, puedes disparar `goblin_hit` en tu `hitEnemy()`, pero ahora mismo esa función está centrada en feedback al jugador, no al enemigo. Lo dejo como opcional para no tocar tu gameplay. 

---

## 4) `Game.ts` — Jefe (trol)

Tu `spawnBoss()` crea un `image` con clave `'boss'` y usa timers para **disparo** y **teletransporte**. Vamos a:

* Usar **Sprite** desde la hoja y reproducir animaciones.
* En `shootTimer`, reproducir `troll_cast` antes del proyectil.
* En `teleportTimer`, reproducir `troll_portal` y luego mover.

Código drop-in (sustituye el método entero):  

```ts
private spawnBoss() {
  const boss = this.physics.add.sprite(700, 300, 'boss_troll_sheet', 0);
  this.boss = boss as any;
  boss.setImmovable(true).setCollideWorldBounds(true);
  this.physics.add.collider(boss, this.platforms);
  this.physics.add.overlap(this.player, boss, this.hitEnemy, undefined, this);
  boss.play('troll_idle');

  this.projectiles = this.physics.add.group();

  // Disparo cada 1.5s con anim de casteo
  this.shootTimer = this.time.addEvent({
    delay: 1500, loop: true, callback: () => {
      if (!this.boss) return;
      boss.play('troll_cast');
      // Lanza el proyectil cuando termina el cast
      boss.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (!this.boss) return;
        const proj = this.projectiles!.create(boss.x, boss.y, 'projectile') as Phaser.Physics.Arcade.Image;
        const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);
        const speed = 220;
        proj.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        boss.play('troll_idle'); // vuelta a idle
      });
    }
  });

  // Teletransporte cada 4s con anim portal
  this.teleportTimer = this.time.addEvent({
    delay: 4000, loop: true, callback: () => {
      if (!this.boss) return;
      boss.play('troll_portal');
      boss.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (!this.boss) return;
        const spots = [ {x: 250, y: 300}, {x: 750, y: 260}, {x: 500, y: 200} ];
        const s = Phaser.Utils.Array.GetRandom(spots);
        boss.setPosition(s.x, s.y);
        this.cameras.main.flash(150, 255, 255, 255);
        boss.play('troll_idle');
      });
    }
  });
}
```

> Mantengo tu **projectile** morado y colisiones existentes en `setupPhysics()`, que ya se encargan de overlap con el jugador y collider con plataformas. 

---

# Plan de acción (para Codex)

1. **Copiar assets**

   * Añadir `goblin_green_sheet.png`, `goblin_red_sheet.png`, `boss_troll_sheet.png` a `public/assets/`.

2. **Preloader.ts**

   * Agregar `load.spritesheet` para los 3 nuevos assets.
   * Crear anims:

     * Duende: `goblin_idle`, `goblin_run`, `goblin_atk`, `goblin_hit`.
     * Trol: `troll_idle`, `troll_run`, `troll_cast`, `troll_portal`.

3. **Game.ts**

   * En `createEnemies()`, cambiar textura `'enemy'` por hoja `goblin_*_sheet`, reproducir `goblin_run`, ajustar `body.setSize(20,26)`.
   * En `update()`, añadir flip horizontal de duendes según velocidad X.
   * Reemplazar `spawnBoss()` para usar sprite `boss_troll_sheet` con animaciones (`troll_idle/cast/portal`), y gatillar cast/teleport en los timers antes de crear proyectil o mover.

4. **(Opcional)** Ajustes finos

   * `goblin_run` a 12 fps si quieres más nervio.
   * `troll_run` si decides moverlo; si el trol es estático, mantén `idle`.
   * `projectile` puede heredar un brillo si le aplicas `setBlendMode(Phaser.BlendModes.ADD)`.

5. **Probar**

   * `pnpm dev` → revisa: duendes caminando con flip correcto; trol casteando antes de disparar; efecto portal antes de teletransportarse.
   * Validar que `setupPhysics()` sigue colisionando proyectiles y plataformas como antes. 

6. **Commit**

   * `feat(art): goblins & troll spritesheets + boss anim flow`.

---

¿Quieres que también te deje un **parche .diff** con las modificaciones exactas en `Preloader.ts` y `Game.ts` para aplicarlo del tirón?
