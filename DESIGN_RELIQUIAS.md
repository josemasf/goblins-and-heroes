# Diseño: Reliquias, Equipamiento y Progresión

## Objetivo
- Añadir exploración con recompensa, progresión del héroe y profundidad estratégica.
- Integración modular y por fases, compatible con la arquitectura Phaser + Vue actual.

## Modelo de Datos
- `player.relics: Relic[]` — reliquias obtenidas durante la partida (persisten entre niveles).
- `player.equipment: EquipmentSlots` — equipo visible (casco, armadura, arma, escudo).
- `player.stats: Stats` — estadísticas derivadas (velocidad, salto, defensa, etc.).

Tipos sugeridos (TypeScript, referencia):

```
export type Rarity = 'Común' | 'Raro' | 'Épico' | 'Legendario';

export interface Relic {
  id: string;           // p.ej. 'amulet_vigor'
  name: string;         // 'Amuleto de Vigor'
  rarity: Rarity;
  type: 'passive' | 'active';
  iconKey?: string;     // key en atlas/spritesheet si aplica
  cooldown?: number;    // ms (solo active)
  duration?: number;    // ms (si aplica efecto temporal)
  lastUsedAt?: number;  // timestamp ms (gestión cooldown)
  stacks?: number;      // acumulaciones si corresponde
  state?: any;          // almacenamiento ligero para lógica concreta
}

export interface EquipmentSlots {
  head?: string;   // id casco
  armor?: string;  // id armadura
  weapon?: string; // id arma
  shield?: string; // id escudo
}

export interface Stats {
  speedX: number;
  jumpV: number;
  maxLives: number;
  defensePct: number; // 0..1
}
```

## Serialización y Persistencia
- Entre escenas: usar `this.registry` (Phaser) para compartir `player.relics`, `player.equipment`, `player.stats`.
  - Claves recomendadas: `relics`, `equipment`, `stats`.
  - Guardar como objetos directos (Phaser Registry soporta referencias), o como JSON si se prefiere `JSON.stringify`/`parse`.
- Entre niveles (ya implementado path/level): asegurar que en `Game.create()` se lea de `registry` y se apliquen efectos.
- Entre partidas (meta‑progresión opcional): `localStorage` con versión: `gnh_meta_v1`.

## Hooks de Integración
- `onSceneCreate(Game)`
  - Leer `relics` y recalcular `player.stats` (aplicar pasivas).
  - Configurar inputs extra (disparo, sigilo) si hay reliquias activas.
- `onCollectRelic(relic: Relic)`
  - Añadir a `player.relics`, aplicar efecto inmediato si procede y mostrar UI (toast + icono HUD).
- `onUpdate(time, delta)`
  - Gestionar cooldowns de reliquias activas (HUD con barra/contador).
- Eventos del juego como disparadores:
  - `onCoinCollected`, `onEnemyKilled`, `onDamaged`, `onPowerUpTaken`, `onJump`.
  - Permiten reliquias que reaccionen (bonus de velocidad, negación de golpe, curación, etc.).

## Reliquias de Ejemplo (MVP)
1) Amuleto de Vigor (Común, passive)
- Efecto: +1 salto extra.
- Lógica: contador `extraJumpCharges = 1` que se resetea al tocar suelo; en `update()`, si salto y `!touching.down` y `charges>0`, permitir salto y `charges--`.
- HUD: icono pasivo.

2) Cráneo Rúnico (Raro, active)
- Efecto: ataque mágico cargado.
- Input: mantener `J` para cargar (hasta 1.2s), soltar para disparar proyectil; daño/velocidad escalan con carga.
- Cooldown: 6s desde el disparo.
- HUD: icono con cooldown.

3) Gema de la Sombra (Épico, active)
- Efecto: invisibilidad 5s (ignora colisiones con enemigos, opacidad 0.5, no invulnerable a caídas).
- Cooldown: 12s.
- HUD: temporizador de duración y cooldown.

4) Corona del Rey Goblin (Legendario, active)
- Efecto: goblins neutrales 8s (no atacan; desactivar overlaps de daño o cambiar grupo temporalmente).
- Cooldown: 30s.
- HUD: icono con barra de duración.

## Sistema de Armas y Armaduras
- `equipment.weapon` cambia animaciones y ataques (espada/ballesta/lanza).
- `equipment.head/armor/shield` ajustan defensa y sprite del héroe (capas).
- Hook: al equipar, actualizar grupo de sprites (capa casco/torso/brazo/arma) y `stats`.

## HUD / UI
- Overlay de reliquias: fila de iconos con rareza (marco color) y estado (activo/cooldown).
- Inventario simple (Fase 1): lista vertical con tooltip.
- Indicadores en juego: texto flotante al recoger + sonido.

## Enemigos Temáticos (resumen técnico)
- `goblin_guard`: más vida/daño, anclado a un cofre; al morir, desbloquea cofre.
- `goblin_shaman`: AI con proyectiles y sumón; prioridad de objetivos.
- `goblin_elite`: con equipo al azar (drop de slot al morir).
- `hatchery` (nido): spawnea minions con límite y cooldown.

## Fases de Implementación
Fase 1 (reliquias funcionales)
- [ ] Añadir entidad Cofre con tabla de loot (Común/Raro/Épico/Legendario).
- [ ] Guardar `player.relics` en `registry` y aplicarlas al crear escena.
- [ ] Implementar Amuleto de Vigor, Cráneo Rúnico, Gema de la Sombra, Corona del Rey Goblin.
- [ ] HUD básico de reliquias (icono + cooldown/duración).

Fase 2 (equipamiento visible)
- [ ] Dividir sprite del héroe en capas (cabeza/torso/brazos/casco/arma/escudo).
- [ ] Implementar 3 armas iniciales (espada, ballesta, lanza) y sus animaciones.

Fase 3 (enemigos y secretos)
- [ ] Nuevos goblins (guardia, chamán, élite) + nido de crías.
- [ ] Cofres protegidos; llaves y puertas selladas; salas secretas.

## Persistencia y Limpieza
- En `Game.create()`:
  - `const relics = this.registry.get('relics') as Relic[] || []`.
  - Aplicar pasivas y configurar inputs.
- Al cambiar de nivel (puertas): mantener `relics` en `registry`.
- Al volver al selector: resetear progreso (opcional), conservar meta‑progresión en `localStorage`.

## Consideraciones
- Evitar efectos que bloqueen input; usar `JustDown`/`JustUp` para activos.
- Priorizar rendimiento: proyectiles y efectos reutilizando grupos.
- Balancear números con constantes (`RELICS_CONFIG`) y facilitar tuning.

```
export const RELICS_CONFIG = {
  skull_rune: { cooldown: 6000, maxChargeMs: 1200 },
  shadow_gem: { cooldown: 12000, duration: 5000 },
  goblin_crown: { cooldown: 30000, duration: 8000 },
};
```

## Próximos Pasos Recomendados
- Implementar Fase 1 (cofres + 4 reliquias) con HUD básico.
- Añadir sonidos/partículas específicos por reliquia.
- Guardar/leer `relics` y `equipment` en `registry` y probar paso entre niveles.

