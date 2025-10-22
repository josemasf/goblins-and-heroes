Perfecto. Aquí tienes un **plan de ejecución claro y corto** para renombrar el proyecto a **Goblins & Heroes** sin romper nada.

---

# Plan “Goblins & Heroes”

## 0) Rama y checklist

```bash
git checkout -b feat/rename-goblins-and-heroes
```

Checklist de salida:

* Título en HTML actualizado
* Título en menú del juego actualizado
* Favicon OK (opcional con la moneda)
* `package.json` con nuevo `name` y `description`
* Docs (`README`, `JUEGO_PLATAFORMAS.md`) actualizados
* Build local OK

---

## 1) Cambiar título del HTML

Edita `index.html` y cambia el `<title>` actual (“Phaser Vue Template”) por el nuevo nombre. 

```html
<title>Goblins & Heroes</title>
```

---

## 2) Título visible dentro del juego (Menú Principal)

En `src/game/scenes/MainMenu.ts`, ahora muestras **"Aventura de Plataformas"** con un `add.text`. Cambia ese string a **Goblins & Heroes**. 

```ts
this.title = this.add.text(512, 350, 'Goblins & Heroes', {
  fontFamily: 'Arial Black', fontSize: 48, color: '#ffffff',
  stroke: '#000000', strokeThickness: 8, align: 'center'
}).setOrigin(0.5).setDepth(100);
```

---

## 2.b) Imagen de en intro

La imagen de public/assets/intro.png la quiero en la portada del juego

---

## 3) (Opcional pero recomendable) Favicon con la moneda

Usa el frame 0 de `coin_sheet.png` para generar el favicon al vuelo desde el `Preloader`. El `Preloader` ya carga assets con `this.load.setPath('assets')` y genera objetos; añade este bloque tras el `COMPLETE` del loader. 

```ts
this.load.once(Phaser.Loader.Events.COMPLETE, () => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  const coin = this.textures.get('coin_sheet').getSourceImage() as HTMLImageElement;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(coin, 0, 0, 24, 24, 4, 4, 24, 24);

  let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  if (!link) { link = document.createElement('link'); link.rel = 'icon'; link.type = 'image/png'; document.head.appendChild(link); }
  link.href = canvas.toDataURL('image/png');
});
```

---

## 4) `package.json`

Actualiza nombre y descripción del paquete para que refleje el juego (y sea instalable sin colisiones). 

```json
{
  "name": "goblins-and-heroes",
  "description": "Goblins & Heroes — juego de plataformas 2D en Phaser + Vue + TypeScript",
  ...
}
```

---

## 5) Documentación

* Renombra cabecera y menciones en `JUEGO_PLATAFORMAS.md` (encabezado y la primera frase). 

  * `# 🎮 Goblins & Heroes`
  * “Un emocionante juego…” → “**Goblins & Heroes** es un juego…”
* Si incluyes un README de producto (aparte del de la plantilla), ajústalo; el actual es el de la plantilla de Phaser, puedes añadir un bloque inicial con el nombre. 

---

## 6) Build y prueba

```bash
pnpm install
pnpm dev
# comprobar: título de la pestaña, menú principal mostrando "Goblins & Heroes", favicon (si hiciste el paso 3)
pnpm build
```

---

## 7) Commit atómico y PR

```bash
git add .
git commit -m "feat: rename project to Goblins & Heroes (title, menu, pkg, docs)"
git push -u origin feat/rename-goblins-and-heroes
# Abre PR y auto-merge tras aprobar
```

---

## 8) (Opcional) Toques de calidad

* **HUD / Game Over**: si quieres, añade “Goblins & Heroes” en la pantalla final encima de “Fin del Juego” en `GameOver.ts`. 
* **Metadatos sociales**: añade en `index.html` meta og:title / description para tarjetas de enlace con el nuevo nombre. 
* **Tagline**: en `MainMenu.ts` puedes añadir un subtítulo pequeño bajo el título (p. ej. *“Elige tu héroe. Domina a los goblins.”*). 

---

### Resultado esperado

* Título del navegador: **Goblins & Heroes** (HTML) 
* Título in-game: **Goblins & Heroes** (Menú) 
* `package.json` con nuevo nombre visible en builds / lockfiles 
* Docs con el nuevo branding 

¿Quieres que te genere un **parche `.diff`** listo para aplicar con todos estos cambios de una?
