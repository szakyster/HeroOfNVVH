export type CollisionRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export interface ICollisionProvider {
  intersects(a: CollisionRect, b: CollisionRect): boolean;
  collidesWithAny(subject: CollisionRect, obstacles: CollisionRect[]): boolean;
}
