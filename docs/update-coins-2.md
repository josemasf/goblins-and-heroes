Vale: si las monedas y los power-ups “no se ven bien”, el problema suele ser **filtro bilineal, sub-píxeles y/o escalado por CSS**. Te dejo un **plan de ejecución** brutalmente concreto para que en Phaser se vean **nítidos, pixel perfect y animados**.

---

# Plan de acción (aplícalo tal cual)

## 1) Phaser config: pixel art sin suavizado

En `src/game/main.ts` ya usas `pixelArt: true`. Añade `render.antialias = false` para forzar el “nearest” del canvas y evitar blur. 

```ts
const config: Phaser.Types.Core.GameConfig = {
  // ...
  pixelArt: true,
  render: { antialias: false }, // <— añade esto
  physics: { /* ... */ },
  scene: [/* ... */]
};
```

## 2) Canvas CSS: que el navegador no borre el pixel

Ajusta `public/style.css` para el lienzo (canvas) dentro de `#game-container`. Esto evita el suavizado si el canvas se escala por CSS. 

```css
#game-container canvas {
  image-rendering: pixelated;
  image-rendering: crisp-edges; /* fallback */
}
```

## 3) Cámara: píxel redondeado

En `Game.ts` ya activaste `roundPixels` en la cámara. Mantén eso (clave para que los tweens no metan sub-píxeles). 

```ts
this.camera = this.cameras.main;
this.camera.roundPixels = true;
```

## 4) Asegura filtro NEAREST en las texturas cargadas

En `Preloader.ts`, tras crear animaciones (en `create()`), fuerza el filtro por textura (Phaser 3.60+). 

```ts
['coin_sheet','pu_life_sheet','pu_speed_sheet','pu_inv_sheet'].forEach(k => {
  this.textures.get(k).setFilter(Phaser.Textures.FilterMode.NEAREST);
});
```

## 5) Animaciones: ya definidas, mantenlas

Tienes las anims correctas (`coin_spin` y `pu_*_idle`). Déjalas igual (o 12–14 fps si quieres suavidad). 

## 6) Instanciación correcta (Sprite + hitbox + bob)

Asegúrate de que **NO** usas `Image` ni `setDisplaySize` con estos assets (eso reescala y emborrona). Usa `Sprite`, `play(anim)`, hitbox compacto y tween que no meta escalas fraccionarias.

### Monedas — `Game.ts` (en `createCoins()`)

```ts
const coin = this.coins.create(x, y, 'coin_sheet', 0) as Phaser.Physics.Arcade.Sprite;
coin.play('coin_spin');
coin.body.setSize(16, 16).setOffset(4, 4); // hitbox centrada
this.tweens.add({
  targets: coin,
  y: coin.y - 4,
  duration: 800,
  yoyo: true,
  repeat: -1,
  ease: 'Sine.inOut'
});
```

> Nada de `setDisplaySize`. Si quieres “hacerlas grandes”, usa `coin.setScale(2)` (enteros, siempre). 

### Power-ups — `Game.ts` (en `createPowerUps()`)

```ts
const pu = this.powerUps.create(x, y, 'pu_speed_sheet', 0) as Phaser.Physics.Arcade.Sprite;
pu.play('pu_speed_idle');
pu.setBlendMode(Phaser.BlendModes.ADD);    // brillo sin blur
pu.body.setSize(16, 16).setOffset(4, 4);
this.tweens.add({
  targets: pu,
  y: pu.y - 4,
  duration: 900,
  yoyo: true,
  repeat: -1,
  ease: 'Sine.inOut'
});
```

> Evita `setDisplaySize`. `setScale(2)` si necesitas, pero **enteros**. Y con `roundPixels` activo no habrá “bailes” sub-píxel. 

## 7) Carga de hojas: OK como spritesheet 24×24

Tu `Preloader.ts` ya carga 24×24 y crea anims. No generes versiones procedurales de monedas/power-ups (ya están como no-op). 

```ts
this.load.spritesheet('coin_sheet','coin_sheet.png',{ frameWidth:24, frameHeight:24 });
this.load.spritesheet('pu_life_sheet','pu_life_sheet.png',{ frameWidth:24, frameHeight:24 });
this.load.spritesheet('pu_speed_sheet','pu_speed_sheet.png',{ frameWidth:24, frameHeight:24 });
this.load.spritesheet('pu_inv_sheet','pu_inv_sheet.png',{ frameWidth:24, frameHeight:24 });
// ...
// Animaciones (ya en tu repo):
// 'coin_spin' y 'pu_*_idle'
```

---

# Checklist de verificación (2 minutos)

1. **Canvas nítido**: inspecciona el `<canvas>` y confirma que tiene `image-rendering: pixelated` aplicado. 
2. **Sin `setDisplaySize`** en monedas/power-ups; si ves blur, busca y elimina ese método. Usa `setScale(2)` entero si hace falta.
3. **Anim corriendo**: monedas con `coin_spin` (12–14 fps), power-ups con `pu_*_idle` (8–12 fps). 
4. **Cámara**: `roundPixels = true` (ya lo tienes). 
5. **Filtro NEAREST** forzado en runtime para las hojas (paso 4). 

---

# ¿Por qué pasaba?

* El **blur** venía del **antialias del canvas** y/o de **escalado CSS** del canvas; también de sub-píxeles al tweenear. Con `pixelArt: true`, `antialias: false`, `image-rendering: pixelated` y `roundPixels`, desaparece.   

---

Si quieres, te genero un **parche `.diff`** con:

* cambio en `main.ts` (antialias),
* CSS `image-rendering: pixelated`,
* y snippet `setFilter(NEAREST)` en `Preloader.ts`.
