import * as THREE from 'three';
import { AIR, LEAVES, BLOCKS, TEX_SIZE, textureCanvases } from './blocks.js';
import { CHUNK, WORLD_HEIGHT } from './world.js';

export function buildAtlas() {
  const names = Object.keys(textureCanvases);
  const cols = Math.ceil(Math.sqrt(names.length));
  const canvas = document.createElement('canvas');
  canvas.width = cols * TEX_SIZE;
  canvas.height = Math.ceil(names.length / cols) * TEX_SIZE;
  const ctx = canvas.getContext('2d');
  const uv = {};
  names.forEach((name, i) => {
    const cx = (i % cols) * TEX_SIZE;
    const cy = Math.floor(i / cols) * TEX_SIZE;
    ctx.drawImage(textureCanvases[name], cx, cy);
    const eps = 0.02 / names.length;
    uv[name] = {
      x0: cx / canvas.width,
      y0: 1 - (cy + TEX_SIZE) / canvas.height,
      x1: (cx + TEX_SIZE) / canvas.width,
      y1: 1 - cy / canvas.height,
      eps,
    };
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return { texture, uv };
}

// face definitions: [normal, 4 corner offsets (CCW from outside), shade]
const FACES = [
  { n: [0, 1, 0], c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], shade: 1.0 }, // top
  { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], shade: 0.5 }, // bottom
  { n: [1, 0, 0], c: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], shade: 0.8 }, // +x
  { n: [-1, 0, 0], c: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], shade: 0.8 }, // -x
  { n: [0, 0, 1], c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], shade: 0.7 }, // +z
  { n: [0, 0, -1], c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], shade: 0.7 }, // -z
];

function faceVisible(world, x, y, z, nx, ny, nz) {
  const nb = world.getBlock(x + nx, y + ny, z + nz);
  if (nb === AIR) return true;
  if (nb === LEAVES) return world.getBlock(x, y, z) !== LEAVES;
  return false;
}

export function buildChunkGeometry(world, cx, cz, uv) {
  const positions = [];
  const uvs = [];
  const colors = [];
  const indices = [];

  const x0 = cx * CHUNK;
  const z0 = cz * CHUNK;

  for (let y = 0; y < WORLD_HEIGHT; y++) {
    for (let z = z0; z < z0 + CHUNK; z++) {
      for (let x = x0; x < x0 + CHUNK; x++) {
        const id = world.getBlock(x, y, z);
        if (id === AIR) continue;
        const def = BLOCKS[id];
        for (const f of FACES) {
          if (!faceVisible(world, x, y, z, f.n[0], f.n[1], f.n[2])) continue;
          const texName = f.n[1] === 1 ? def.top : f.n[1] === -1 ? def.bottom : def.side;
          const t = uv[texName];
          const base = positions.length / 3;
          for (let i = 0; i < 4; i++) {
            const c = f.c[i];
            positions.push(x + c[0], y + c[1], z + c[2]);
            const u = i === 1 || i === 2 ? t.x1 - t.eps : t.x0 + t.eps;
            const v = i === 0 || i === 1 ? t.y0 + t.eps : t.y1 - t.eps;
            uvs.push(u, v);
            colors.push(f.shade, f.shade, f.shade);
          }
          indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
        }
      }
    }
  }

  if (positions.length === 0) return null;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeBoundingSphere();
  return geo;
}

export function chunkKey(cx, cz) {
  return `${cx},${cz}`;
}

