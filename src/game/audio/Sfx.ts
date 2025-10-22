import { Scene } from 'phaser';

export type WaveType = OscillatorType;

// Simple WebAudio SFX helper using Phaser's audio context
export class Sfx {
  static tone(
    scene: Scene,
    freq: number,
    duration = 0.15,
    type: WaveType = 'sine',
    volume = 0.2
  ) {
    // Use Phaser WebAudio context when available
    // @ts-expect-error Phaser typing for sound.context exists at runtime
    const ctx: AudioContext | undefined = scene.sound?.context as any;
    if (!ctx || (ctx as any).state === 'closed') return; // Fallback: skip when no WebAudio or closed

    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);

    // Quick attack, short decay envelope
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  static click(scene: Scene) {
    this.tone(scene, 600, 0.05, 'square', 0.15);
  }

  static jump(scene: Scene) {
    this.tone(scene, 420, 0.12, 'square', 0.2);
  }

  static coin(scene: Scene) {
    // Two short blips
    this.tone(scene, 880, 0.06, 'triangle', 0.22);
    setTimeout(() => this.tone(scene, 1320, 0.07, 'triangle', 0.2), 50);
  }

  static hit(scene: Scene) {
    this.tone(scene, 180, 0.2, 'sawtooth', 0.25);
  }

  static win(scene: Scene) {
    const notes = [660, 880, 990, 1320];
    notes.forEach((f, i) => setTimeout(() => this.tone(scene, f, 0.08, 'triangle', 0.2), i * 90));
  }

  static gameOver(scene: Scene) {
    this.tone(scene, 300, 0.18, 'sine', 0.22);
    setTimeout(() => this.tone(scene, 220, 0.22, 'sine', 0.22), 160);
  }

  static powerUp(scene: Scene) {
    const notes = [523, 659, 784];
    notes.forEach((f, i) => setTimeout(() => this.tone(scene, f, 0.06, 'square', 0.18), i * 70));
  }
}
