import { Scene, Sound } from 'phaser';

type TrackKey = string;

interface TrackDef {
  file: string;
  volume?: number;
  loop?: boolean;
}

interface MusicConfig {
  defaultVolume?: number;
  crossfadeMs?: number;
  tracks: Record<TrackKey, TrackDef>;
}

/**
 * Gestor de música de fondo (Phaser 3.60+)
 * - Carga config desde cache JSON 'music_config' (precargada en Preloader).
 * - Reutiliza instancias BaseSound por clave (no duplica).
 * - Crossfade con tween de volumen.
 * - Mute/unmute, pausa/resume, volumen por pista y global, intensidad dinámica.
 * - Auto pause/resume por visibilitychange y desbloqueo móvil al primer pointer.
 */
export class MusicManager {
  private static _instance: MusicManager | null = null;
  static get(scene: Scene): MusicManager {
    if (!this._instance) this._instance = new MusicManager();
    this._instance.init(scene);
    return this._instance;
  }
  // Alias para compatibilidad previa si alguien usa .instance
  static get instance(): MusicManager {
    if (!this._instance) this._instance = new MusicManager();
    return this._instance;
  }

  private scene: Scene | null = null;
  private config: MusicConfig | null = null;

  private sounds = new Map<TrackKey, Sound.BaseSound>();
  private baseVolumes = new Map<TrackKey, number>();
  private currentKey: TrackKey | null = null;
  private current: Sound.BaseSound | null = null;

  private muted = false;
  private masterVolume = 1.0;
  private intensity = 1.0;
  private unlocked = false;
  private visibilityHandlerBound = false;

  private init(scene: Scene): void {
    if (this.scene === scene) return;
    this.scene = scene;

    if (!this.config) {
      const cfg = scene.cache.json.get('music_config') as MusicConfig | undefined;
      if (cfg && cfg.tracks) this.config = cfg;
    }

    try {
      const m = window.localStorage.getItem('musicMuted');
      const v = window.localStorage.getItem('musicVolume');
      const i = window.localStorage.getItem('musicIntensity');
      if (m != null) this.muted = m === '1';
      if (v != null) this.masterVolume = clamp01(parseFloat(v));
      if (i != null) this.intensity = clamp01(parseFloat(i));
    } catch {}

    if (!this.visibilityHandlerBound) {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.pause();
        else this.resume();
      });
      this.visibilityHandlerBound = true;
    }

    scene.input?.once('pointerdown', () => {
      if (this.unlocked) return;
      try {
        (scene.sound as any)?.unlock?.();
      } catch {}
      this.unlocked = true;
    });
  }

  /** Reproduce una pista; fadeIn opcional en ms. */
  play(key: TrackKey, opts?: { fadeIn?: number }): void {
    const scene = this.scene;
    if (!scene) return;
    if (!this.ensureLoaded(key)) return;

    const next = this.ensureSound(key);
    const fade = Math.max(0, opts?.fadeIn ?? 0);

    if (this.current === next && (this.current as any)?.isPlaying) {
      this.applyVolume(this.currentKey);
      return;
    }

    if (this.current && (this.current as any).isPlaying) {
      this.stop(0);
    }

    setSoundVolume(next, fade > 0 ? 0 : this.computeVolume(key));
    (next as any).play?.();

    if (fade > 0) {
      this.tweenVolume(next, 0, this.computeVolume(key), fade);
    }

    this.currentKey = key;
    this.current = next;
  }

  /** Crossfade entre la pista actual y la siguiente durante durationMs. */
  crossfade(nextKey: TrackKey, durationMs: number): void {
    const scene = this.scene;
    if (!scene) return;
    if (!this.ensureLoaded(nextKey)) return;

    const from = this.current;
    const to = this.ensureSound(nextKey);

    if (from === to) {
      this.applyVolume(nextKey);
      return;
    }

    setSoundVolume(to, 0);
    (to as any).play?.();

    const targetVol = this.computeVolume(nextKey);
    const dur = Math.max(0, durationMs | 0);

    if (from && (from as any).isPlaying) {
      this.tweenVolume(from, getSoundVolume(from), 0, dur, () => {
        (from as any).stop?.();
      });
    }
    this.tweenVolume(to, 0, targetVol, dur);

    this.currentKey = nextKey;
    this.current = to;
  }

  /** Detiene la reproducción. Si se indica fadeOutMs, hace fade-out primero. */
  stop(fadeOutMs?: number): void {
    const s = this.current;
    if (!s) return;

    const out = Math.max(0, fadeOutMs ?? 0);
    if (out > 0) {
      const from = getSoundVolume(s);
      this.tweenVolume(s, from, 0, out, () => {
        (s as any).stop?.();
      });
    } else {
      (s as any).stop?.();
    }
    this.current = null;
    this.currentKey = null;
  }

  /** Volumen: 'all' para global, o por clave. */
  setVolume(target: 'all' | TrackKey, vol: number): void {
    const v = clamp01(vol);
    if (target === 'all') {
      this.masterVolume = v;
      try { window.localStorage.setItem('musicVolume', String(this.masterVolume)); } catch {}
      this.applyVolume(this.currentKey);
    } else {
      this.baseVolumes.set(target, v);
      if (this.currentKey === target) this.applyVolume(target);
    }
  }

  mute(): void {
    this.muted = true;
    try { window.localStorage.setItem('musicMuted', '1'); } catch {}
    this.applyVolume(this.currentKey);
  }

  unmute(): void {
    this.muted = false;
    try { window.localStorage.setItem('musicMuted', '0'); } catch {}
    this.applyVolume(this.currentKey);
  }

  pause(): void {
    if (this.current && (this.current as any).isPlaying) {
      (this.current as any).pause?.();
    }
  }

  resume(): void {
    if (this.current && (this.current as any).isPaused) {
      (this.current as any).resume?.();
    }
  }

  /** Modula el volumen final con una intensidad [0..1]. */
  setIntensity(percent: number): void {
    this.intensity = clamp01(percent);
    try { window.localStorage.setItem('musicIntensity', String(this.intensity)); } catch {}
    this.applyVolume(this.currentKey);
  }

  /**
   * Selección de tema por contexto:
   * - L1 → castle_theme
   * - L2A → crypt_theme
   * - L2B → crystals_theme
   * - L3A → throne_theme
   * - L3B → lava_theme
   */
  playForContext(ctx: { levelIndex: number; path?: 'A' | 'B' }, fadeInMs?: number): void {
    const { levelIndex, path } = ctx;
    let key: TrackKey = 'castle_theme';
    if (levelIndex === 1) key = 'castle_theme';
    else if (levelIndex === 2) key = (path === 'B' ? 'crystals_theme' : 'crypt_theme');
    else key = (path === 'B' ? 'lava_theme' : 'throne_theme');
    this.play(key, { fadeIn: fadeInMs });
  }

  // Internos

  private ensureLoaded(key: TrackKey): boolean {
    const scene = this.scene;
    if (!scene) return false;
    const exists = scene.cache.audio?.exists(key);
    if (!exists) {
      console.warn(`[Music] Audio key "${key}" no está cargada.`);
      return false;
    }
    if (!this.baseVolumes.has(key)) {
      const vol = this.lookupBaseVolume(key);
      this.baseVolumes.set(key, vol);
    }
    return true;
  }

  private ensureSound(key: TrackKey): Sound.BaseSound {
    const cached = this.sounds.get(key);
    if (cached) return cached;
    const s = this.scene!.sound.add(key, {
      loop: this.lookupLoop(key),
      volume: 0
    });
    this.sounds.set(key, s);
    return s;
  }

  private lookupBaseVolume(key: TrackKey): number {
    const def = this.config?.tracks?.[key];
    const defVol = typeof def?.volume === 'number' ? def!.volume : (this.config?.defaultVolume ?? 0.3);
    return clamp01(defVol);
  }

  private lookupLoop(key: TrackKey): boolean {
    const def = this.config?.tracks?.[key];
    return typeof def?.loop === 'boolean' ? !!def!.loop : true;
  }

  private computeVolume(key: TrackKey | null): number {
    const base = key ? (this.baseVolumes.get(key) ?? this.lookupBaseVolume(key)) : (this.config?.defaultVolume ?? 0.3);
    if (this.muted) return 0;
    return clamp01(base * this.masterVolume * this.intensity);
  }

  private applyVolume(key: TrackKey | null): void {
    if (!this.current) return;
    setSoundVolume(this.current, this.computeVolume(key));
  }

  private tweenVolume(
    sound: Sound.BaseSound,
    from: number,
    to: number,
    durationMs: number,
    onComplete?: () => void
  ): void {
    const scene = this.scene!;
    const proxy = { v: clamp01(from) };
    scene.tweens.add({
      targets: proxy,
      v: clamp01(to),
      duration: Math.max(0, durationMs),
      onUpdate: () => setSoundVolume(sound, proxy.v),
      onComplete: () => { if (onComplete) onComplete(); }
    });
  }
}

function setSoundVolume(s: Sound.BaseSound, v: number): void {
  const anyS = s as any;
  if (typeof anyS.setVolume === 'function') anyS.setVolume(clamp01(v));
  else anyS.volume = clamp01(v);
}

function getSoundVolume(s: Sound.BaseSound): number {
  const anyS = s as any;
  if (typeof anyS.getVolume === 'function') return clamp01(anyS.getVolume());
  return clamp01(anyS.volume ?? 0);
}

function clamp01(x: number): number {
  if (!isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

export default MusicManager;
