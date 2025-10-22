export function getTopYForX(platforms: Phaser.Physics.Arcade.StaticGroup, x: number, fallback = 420): number {
  let y = fallback;
  const children = platforms.getChildren() as any[];
  children.forEach((obj: any) => {
    if (!obj || typeof obj.x !== 'number' || typeof obj.y !== 'number') return;
    const w = (obj.displayWidth ?? 100);
    const h = (obj.displayHeight ?? 20);
    const halfW = w / 2;
    if (x >= obj.x - halfW && x <= obj.x + halfW) {
      const top = obj.y - h / 2;
      if (top < y) y = top;
    }
  });
  return y;
}

