import type { CollisionRect, ICollisionProvider } from './ICollisionProvider';

export class SimpleCollisionProvider implements ICollisionProvider {
  intersects(a: CollisionRect, b: CollisionRect): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  collidesWithAny(subject: CollisionRect, obstacles: CollisionRect[]): boolean {
    return obstacles.some((obstacle) => this.intersects(subject, obstacle));
  }
}
