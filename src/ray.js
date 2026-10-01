import { AIR } from './blocks.js';

export function raycast(world, origin, direction, maxDistance = 6) {
  let x = Math.floor(origin.x);
  let y = Math.floor(origin.y);
  let z = Math.floor(origin.z);

  const stepX = direction.x > 0 ? 1 : -1;
  const stepY = direction.y > 0 ? 1 : -1;
  const stepZ = direction.z > 0 ? 1 : -1;

  const tDeltaX = direction.x !== 0 ? Math.abs(1 / direction.x) : Infinity;
  const tDeltaY = direction.y !== 0 ? Math.abs(1 / direction.y) : Infinity;
  const tDeltaZ = direction.z !== 0 ? Math.abs(1 / direction.z) : Infinity;

  let tMaxX =
    direction.x !== 0
      ? ((stepX > 0 ? x + 1 - origin.x : origin.x - x) / Math.abs(direction.x))
      : Infinity;
  let tMaxY =
    direction.y !== 0
      ? ((stepY > 0 ? y + 1 - origin.y : origin.y - y) / Math.abs(direction.y))
      : Infinity;
  let tMaxZ =
    direction.z !== 0
      ? ((stepZ > 0 ? z + 1 - origin.z : origin.z - z) / Math.abs(direction.z))
      : Infinity;

  let normal = { x: 0, y: 0, z: 0 };
  let t = 0;

  for (let i = 0; i < 256 && t <= maxDistance; i++) {
    if (world.getBlock(x, y, z) !== AIR) {
      return { x, y, z, normal };
    }
    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      x += stepX;
      t = tMaxX;
      tMaxX += tDeltaX;
      normal = { x: -stepX, y: 0, z: 0 };
    } else if (tMaxY < tMaxZ) {
      y += stepY;
      t = tMaxY;
      tMaxY += tDeltaY;
      normal = { x: 0, y: -stepY, z: 0 };
    } else {
      z += stepZ;
      t = tMaxZ;
      tMaxZ += tDeltaZ;
      normal = { x: 0, y: 0, z: -stepZ };
    }
  }

  return null;
}
