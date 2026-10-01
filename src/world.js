import { AIR, GRASS, DIRT, STONE, WOOD, LEAVES, SAND } from './blocks.js';

export const CHUNK = 16;
export const WORLD_HEIGHT = 64;
export const WORLD_CHUNKS = 8; // 8x8 chunks = 128x128 blocks
export const WORLD_SIZE = CHUNK * WORLD_CHUNKS;

export function hash2(x, y, seed) {
  let h = seed ^ (x * 374761393) ^ (y * 668265263);
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function noise2(x, y, seed) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const tx = smoothstep(x - xi);
  const ty = smoothstep(y - yi);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
}

function terrainHeight(x, z, seed) {
  let h = 0;
  h += noise2(x / 48, z / 48, seed) * 18;
  h += noise2(x / 20, z / 20, seed + 101) * 8;
  h += noise2(x / 8, z / 8, seed + 202) * 3;
  return Math.floor(8 + h);
}

export class World {
  constructor(seed = 1337) {
    this.seed = seed;
    this.blocks = new Uint8Array(WORLD_SIZE * WORLD_HEIGHT * WORLD_SIZE);
    this.generate();
  }

  index(x, y, z) {
    return (y * WORLD_SIZE + z) * WORLD_SIZE + x;
  }

  inBounds(x, y, z) {
    return x >= 0 && y >= 0 && z >= 0 && x < WORLD_SIZE && z < WORLD_SIZE && y < WORLD_HEIGHT;
  }

  getBlock(x, y, z) {
    if (!this.inBounds(x, y, z)) return AIR;
    return this.blocks[this.index(x, y, z)];
  }

  setBlock(x, y, z, id) {
    if (!this.inBounds(x, y, z)) return;
    this.blocks[this.index(x, y, z)] = id;
  }

  surfaceY(x, z) {
    for (let y = WORLD_HEIGHT - 1; y >= 0; y--) {
      if (this.getBlock(x, y, z) !== AIR) return y;
    }
    return 0;
  }

  generate() {
    const { seed } = this;
    for (let z = 0; z < WORLD_SIZE; z++) {
      for (let x = 0; x < WORLD_SIZE; x++) {
        const h = terrainHeight(x, z, seed);
        const beach = h <= 11;
        for (let y = 0; y <= h; y++) {
          let id;
          if (y === h) id = beach ? SAND : GRASS;
          else if (y >= h - 3) id = beach ? SAND : DIRT;
          else id = STONE;
          this.setBlock(x, y, z, id);
        }
      }
    }
    this.generateTrees();
  }

  generateTrees() {
    const { seed } = this;
    for (let z = 2; z < WORLD_SIZE - 2; z += 1) {
      for (let x = 2; x < WORLD_SIZE - 2; x += 1) {
        if (hash2(x * 3 + 7, z * 5 + 13, seed + 999) > 0.9985) {
          this.plantTree(x, z);
        }
      }
    }
  }

  plantTree(x, z) {
    const ground = this.surfaceY(x, z);
    const h = terrainHeight(x, z, this.seed);
    if (h <= 11) return; // no trees on sand
    if (ground !== h) return;
    const height = 4 + ((hash2(x, z, this.seed + 5) * 3) | 0);
    const topY = ground + height;
    if (topY >= WORLD_HEIGHT) return;
    for (let y = ground + 1; y <= topY; y++) this.setBlock(x, y, z, WOOD);
    for (let dy = -2; dy <= 2; dy++) {
      const r = dy < -1 ? 1 : 2;
      const y = topY + dy;
      if (y >= WORLD_HEIGHT) continue;
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (dx === 0 && dz === 0 && dy < 2) continue;
          if (Math.abs(dx) === r && Math.abs(dz) === r && hash2(x + dx, y * 31 + dz, this.seed) > 0.5) continue;
          if (this.getBlock(x + dx, y, z + dz) === AIR) {
            this.setBlock(x + dx, y, z + dz, LEAVES);
          }
        }
      }
    }
  }
}
