export type HeroKey = 'hero_speed' | 'hero_jump' | 'hero_tank';

export interface HeroStats {
  speedX: number;
  jumpV: number;
  lives: number;
}

export class HeroStatsService {
  static getStats(key: HeroKey): HeroStats {
    switch (key) {
      case 'hero_speed':
        return { speedX: 420, jumpV: -600, lives: 2 };
      case 'hero_tank':
        return { speedX: 250, jumpV: -600, lives: 4 };
      case 'hero_jump':
      default:
        return { speedX: 300, jumpV: -750, lives: 3 };
    }
  }

  static getSheetKey(key: HeroKey): string {
    if (key === 'hero_speed') return 'hero_speed_sheet';
    if (key === 'hero_tank') return 'hero_tank_sheet';
    return 'hero_jump_sheet';
  }

  static getLabel(key: HeroKey): string {
    if (key === 'hero_speed') return 'Velocidad';
    if (key === 'hero_tank') return 'Tanque';
    return 'Salto';
  }
}

