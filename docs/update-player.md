# Plan de acción (para correr en Codex / agente)

Objetivo: integrar las hojas y dejar todo animado con **idle, run, jump, pick**, sin romper tu lógica actual.

## 1) Assets

* Copia los 3 PNG a `public/assets/` (o tu carpeta `assets` servida). Tu preloader ya usa `this.load.setPath('assets')`. 

## 2) `Preloader.ts`

**a) Desactiva sprites procedurales de héroes**

* En `createHeroSprites()`, elimina o comenta la generación con `this.add.graphics().generateTexture(...)`. (Así evitas texturas `hero_*_1`, `hero_*_2`, etc.). 

**b) Carga spritesheets en `preload()`**

```ts
this.load.spritesheet('hero_speed_sheet', 'assets/hero_speed_sheet.png', { frameWidth: 32, frameHeight: 32 });
this.load.spritesheet('hero_jump_sheet',  'assets/hero_jump_sheet.png',  { frameWidth: 32, frameHeight: 32 });
this.load.spritesheet('hero_tank_sheet',  'assets/hero_tank_sheet.png',  { frameWidth: 32, frameHeight: 32 });
```

**c) Crea animaciones en `create()`** (reemplaza las `walk_*` que ya tenías por éstas—mantengo nombres `walk_*` para compatibilidad con tu `Game.ts`). 

```ts
// SPEED
this.anims.create({ key:'idle_speed', frames: this.anims.generateFrameNumbers('hero_speed_sheet',{start:0,end:3}), frameRate:6,  repeat:-1 });
this.anims.create({ key:'walk_speed', frames: this.anims.generateFrameNumbers('hero_speed_sheet',{start:4,end:9}), frameRate:12, repeat:-1 });
this.anims.create({ key:'jump_speed', frames: this.anims.generateFrameNumbers('hero_speed_sheet',{start:10,end:12}), frameRate:8,  repeat:0  });
this.anims.create({ key:'pick_speed', frames: this.anims.generateFrameNumbers('hero_speed_sheet',{start:13,end:16}), frameRate:10, repeat:0  });

// JUMP
this.anims.create({ key:'idle_jump',  frames: this.anims.generateFrameNumbers('hero_jump_sheet',{start:0,end:3}),  frameRate:6,  repeat:-1 });
this.anims.create({ key:'walk_jump',  frames: this.anims.generateFrameNumbers('hero_jump_sheet',{start:4,end:9}),  frameRate:12, repeat:-1 });
this.anims.create({ key:'jump_jump',  frames: this.anims.generateFrameNumbers('hero_jump_sheet',{start:10,end:12}), frameRate:8,  repeat:0  });
this.anims.create({ key:'pick_jump',  frames: this.anims.generateFrameNumbers('hero_jump_sheet',{start:13,end:16}), frameRate:10, repeat:0  });

// TANK
this.anims.create({ key:'idle_tank',  frames: this.anims.generateFrameNumbers('hero_tank_sheet',{start:0,end:3}),  frameRate:5,  repeat:-1 });
this.anims.create({ key:'walk_tank',  frames: this.anims.generateFrameNumbers('hero_tank_sheet',{start:4,end:9}),  frameRate:10, repeat:-1 });
this.anims.create({ key:'jump_tank',  frames: this.anims.generateFrameNumbers('hero_tank_sheet',{start:10,end:12}), frameRate:6,  repeat:0  });
this.anims.create({ key:'pick_tank',  frames: this.anims.generateFrameNumbers('hero_tank_sheet',{start:13,end:16}), frameRate:8,  repeat:0  });
```

## 3) `Game.ts`

**a) Crear el jugador desde la hoja**
Sustituye el uso de texturas sueltas (`hero_speed_1`, etc.) por la hoja + frame 0: 

```ts
private sheetKeyFromHero(key: string): string {
  if (key === 'hero_speed') return 'hero_speed_sheet';
  if (key === 'hero_tank')  return 'hero_tank_sheet';
  return 'hero_jump_sheet';
}

createPlayer() {
  const sheet = this.sheetKeyFromHero(this.heroKey);
  this.player = this.physics.add.sprite(100, 700, sheet, 0);
  this.player.setBounce(0.2).setCollideWorldBounds(true).setScale(1);
}
```

**b) Update: usar anims para aire/caminar/idle**
Reemplaza el bloque que usa `setTexture(this.jumpFrameFromHero(...))` por animaciones:

```ts
const onGround = this.player.body!.touching.down;
const vx = this.player.body!.velocity.x;
const moving = Math.abs(vx) > 10 && onGround;

const isSpeed = this.heroKey === 'hero_speed';
const isTank  = this.heroKey === 'hero_tank';
const walkKey = isSpeed ? 'walk_speed' : isTank ? 'walk_tank' : 'walk_jump';
const idleKey = isSpeed ? 'idle_speed' : isTank ? 'idle_tank' : 'idle_jump';
const jumpKey = isSpeed ? 'jump_speed' : isTank ? 'jump_tank' : 'jump_jump';

if (!onGround) {
  if (this.player.anims.currentAnim?.key !== jumpKey) this.player.anims.play(jumpKey, true);
} else if (moving) {
  if (this.player.anims.currentAnim?.key !== walkKey) this.player.anims.play(walkKey, true);
} else {
  if (this.player.anims.currentAnim?.key !== idleKey) this.player.anims.play(idleKey, true);
}
```

**c) `collectCoin()` dispara “pick”**
Inyecta esto después de sumar puntos/actualizar HUD: 

```ts
const pickKey = this.heroKey === 'hero_speed' ? 'pick_speed' :
                this.heroKey === 'hero_tank'  ? 'pick_tank'  : 'pick_jump';
const idleKey = this.heroKey === 'hero_speed' ? 'idle_speed' :
                this.heroKey === 'hero_tank'  ? 'idle_tank'  : 'idle_jump';

if (this.player.body!.touching.down) {
  this.player.anims.play(pickKey);
  this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
    this.player.anims.play(idleKey, true);
  });
}
```

## 4) `CharacterSelect.ts` (preview opcional)

Ahora que no hay `hero_*_1`, renderiza **frame 0** de cada hoja como preview o deja solo texto. Ejemplo:

```ts
const img = this.add.image(x, y - 10, 'hero_speed_sheet', 0).setScale(3);
```

El resto del selector (persistencia y `registry`) ya te sirve tal cual. 

---

# Script de tareas (Codex-friendly)

1. **Mover assets**: Copiar `hero_*_sheet.png` a `public/assets/`.
2. **Preloader.ts**

   * Eliminar contenido de `createHeroSprites()`.
   * Añadir `load.spritesheet` para speed/jump/tank.
   * Reemplazar animaciones por `idle_*`, `walk_*`, `jump_*`, `pick_*`.
3. **Game.ts**

   * Cambiar `createPlayer()` para usar `*_sheet` + frame `0`.
   * En `update()`, usar `idle_*/walk_*/jump_*` como arriba.
   * En `collectCoin()`, reproducir `pick_*` y volver a `idle_*`.
4. **CharacterSelect.ts** (opcional)

   * Cambiar thumbs a `image(..., 'hero_*_sheet', 0)` o quitarlos.
5. **Probar**: `pnpm dev` y validar animaciones en: idle, correr, salto, recoger moneda.
6. **Ajustes finos**: Si quieres más “nervio” en el rápido, sube `frameRate` de `walk_speed` a 14–16; para tanque bájalo a 8–10.
7. **Commit**: `feat(hero): switch to spritesheet-based animations`.

---

¿Quieres que también te deje un **parche .diff** listo para aplicar sobre tu repo con todos los cambios?
