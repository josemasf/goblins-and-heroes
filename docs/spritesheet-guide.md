# Guía de Spritesheets para el Juego

## 📐 Dimensiones requeridas

### Formato ideal para pixel art (24×24 por frame)

#### Monedas
- **Archivo**: `coin_sheet.png`
- **Dimensiones totales**: 192×48 píxeles (o 384×96 para doble resolución)
- **Grid**: 8 frames horizontales × 1 fila
- **Frame size**: 24×24 píxeles (o 48×48)
- **Total frames**: 8 frames para animación de giro

#### Power-ups (vida, velocidad, invencibilidad)
- **Archivos**: `pu_life_sheet.png`, `pu_speed_sheet.png`, `pu_inv_sheet.png`
- **Dimensiones totales**: 192×48 píxeles (o 384×96)
- **Grid**: 8 frames horizontales × 1 fila
- **Frame size**: 24×24 píxeles (o 48×48)
- **Total frames**: 8 frames para animación idle/pulso

## 🛠️ Cómo crear los spritesheets

### Opción 1: Piskel (Recomendado - Gratis, Online)
1. Ve a https://www.piskelapp.com/
2. Create Sprite → Set frame size: 24×24
3. Dibuja tu sprite en cada frame
4. Export → Download PNG (sprite sheet)
5. Asegúrate de exportar como 1 fila × 8 columnas

### Opción 2: Aseprite (De pago, profesional)
1. New Sprite → 24×24 pixels
2. Crea 8 frames
3. File → Export Sprite Sheet
4. Layout: Horizontal strip (1 row)
5. Export

### Opción 3: Redimensionar existentes con ImageMagick
```powershell
# Instalar: https://imagemagick.org/
cd public/assets

# Redimensionar manteniendo pixel art (sin blur)
magick coin_sheet.png -sample 192x48! coin_sheet_new.png
magick pu_life_sheet.png -sample 192x48! pu_life_new.png
magick pu_speed_sheet.png -sample 192x48! pu_speed_new.png
magick pu_inv_sheet.png -sample 192x48! pu_inv_new.png

# Reemplazar archivos originales
mv coin_sheet_new.png coin_sheet.png
mv pu_life_new.png pu_life_sheet.png
mv pu_speed_new.png pu_speed_sheet.png
mv pu_inv_new.png pu_inv_sheet.png
```

## 📝 Actualizar código después de cambiar imágenes

Si cambias las imágenes a 192×48 (8 frames de 24×24), actualiza `Preloader.ts`:

```typescript
// En preload():
this.load.spritesheet('coin_sheet', 'coin_sheet.png', { 
    frameWidth: 24, 
    frameHeight: 24 
});
this.load.spritesheet('pu_life_sheet', 'pu_life_sheet.png', { 
    frameWidth: 24, 
    frameHeight: 24 
});
this.load.spritesheet('pu_speed_sheet', 'pu_speed_sheet.png', { 
    frameWidth: 24, 
    frameHeight: 24 
});
this.load.spritesheet('pu_inv_sheet', 'pu_inv_sheet.png', { 
    frameWidth: 24, 
    frameHeight: 24 
});

// En create(), las animaciones usarán 0-7 (8 frames) en lugar de 0-15:
this.anims.create({ 
    key: 'coin_spin', 
    frames: this.anims.generateFrameNumbers('coin_sheet', { start: 0, end: 7 }), 
    frameRate: 14, 
    repeat: -1 
});
```

Y en `Game.ts`, puedes **ELIMINAR** el `setScale(0.125)` porque ya estarán al tamaño correcto.

## ✅ Checklist

- [ ] Spritesheets tienen exactamente 8 frames cada uno
- [ ] Cada frame es 24×24 píxeles (o 48×48 para 2x)
- [ ] Formato PNG con transparencia
- [ ] Sin espaciado entre frames
- [ ] Organizados en 1 fila horizontal
- [ ] Nombres de archivo coinciden exactamente: `coin_sheet.png`, `pu_life_sheet.png`, etc.
