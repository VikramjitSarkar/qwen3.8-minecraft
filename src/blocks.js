export const AIR = 0;
export const GRASS = 1;
export const DIRT = 2;
export const STONE = 3;
export const WOOD = 4;
export const LEAVES = 5;
export const SAND = 6;
export const PLANK = 7;

export const BLOCKS = {
  [AIR]: null,
  [GRASS]: { id: GRASS, name: 'Grass', solid: true, top: 'grass_top', bottom: 'dirt', side: 'grass_side' },
  [DIRT]: { id: DIRT, name: 'Dirt', solid: true, top: 'dirt', bottom: 'dirt', side: 'dirt' },
  [STONE]: { id: STONE, name: 'Stone', solid: true, top: 'stone', bottom: 'stone', side: 'stone' },
  [WOOD]: { id: WOOD, name: 'Wood', solid: true, top: 'wood_top', bottom: 'wood_top', side: 'wood_side' },
  [LEAVES]: { id: LEAVES, name: 'Leaves', solid: true, top: 'leaves', bottom: 'leaves', side: 'leaves' },
  [SAND]: { id: SAND, name: 'Sand', solid: true, top: 'sand', bottom: 'sand', side: 'sand' },
  [PLANK]: { id: PLANK, name: 'Plank', solid: true, top: 'plank', bottom: 'plank', side: 'plank' },
};

export const HOTBAR = [GRASS, DIRT, STONE, WOOD, LEAVES, SAND, PLANK];

const TEX_SIZE = 16;

const palettes = {
  grass_top: () => [88, 154, 60],
  grass_side: () => [134, 96, 67],
  dirt: () => [134, 96, 67],
  stone: () => [125, 125, 125],
  wood_side: () => [106, 84, 50],
  wood_top: () => [160, 130, 75],
  leaves: () => [58, 122, 45],
  sand: () => [218, 206, 160],
  plank: () => [186, 144, 82],
};

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function buildTexture(name) {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_SIZE;
  canvas.height = TEX_SIZE;
  const ctx = canvas.getContext('2d');
  const base = palettes[name]();
  const rand = rng(name.length * 7919 + name.charCodeAt(0) * 131);
  for (let y = 0; y < TEX_SIZE; y++) {
    for (let x = 0; x < TEX_SIZE; x++) {
      let [r, g, b] = base;
      const jitter = (rand() - 0.5) * 28;
      r += jitter;
      g += jitter;
      b += jitter * 0.6;
      ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  if (name === 'grass_side') {
    for (let x = 0; x < TEX_SIZE; x++) {
      const depth = 3 + ((x * 37) % 3);
      ctx.fillStyle = 'rgb(88,154,60)';
      ctx.fillRect(x, 0, 1, depth);
    }
  }
  if (name === 'wood_side') {
    ctx.fillStyle = 'rgba(70,52,28,0.55)';
    for (const x of [2, 5, 8, 11, 14]) ctx.fillRect(x, 0, 1, TEX_SIZE);
  }
  if (name === 'wood_top') {
    for (let i = 2; i < TEX_SIZE; i += 3) {
      ctx.strokeStyle = 'rgba(70,52,28,0.6)';
      ctx.strokeRect(i / 2, i / 2, TEX_SIZE - i, TEX_SIZE - i);
    }
  }
  if (name === 'stone') {
    ctx.fillStyle = 'rgba(80,80,80,0.5)';
    for (let i = 0; i < 8; i++) {
      const x = (i * 5) % TEX_SIZE;
      const y = (i * 7) % TEX_SIZE;
      ctx.fillRect(x, y, 2 + (i % 3), 1 + (i % 2));
    }
  }
  if (name === 'plank') {
    ctx.fillStyle = 'rgba(120,88,44,0.7)';
    for (const y of [3, 7, 11, 15]) ctx.fillRect(0, y, TEX_SIZE, 1);
  }
  if (name === 'leaves') {
    const rand2 = rng(99);
    for (let i = 0; i < 40; i++) {
      const x = (rand2() * TEX_SIZE) | 0;
      const y = (rand2() * TEX_SIZE) | 0;
      ctx.fillStyle = rand2() > 0.5 ? 'rgba(38,92,30,0.8)' : 'rgba(80,150,60,0.7)';
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

const textureCanvases = {};
for (const name of Object.keys(palettes)) {
  textureCanvases[name] = buildTexture(name);
}

export function getBlockIcon(blockId, size = 36) {
  const def = BLOCKS[blockId];
  const src = textureCanvases[def.side];
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, size, size);
  return canvas;
}

export { TEX_SIZE, textureCanvases };
