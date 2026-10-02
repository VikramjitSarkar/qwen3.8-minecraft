# Minecraft Clone (Three.js)

[![Watch: Qwen 3.8 27B thought for 82 minutes, then built this from one prompt](https://img.youtube.com/vi/Prww8NdNQIo/maxresdefault.jpg)](https://youtu.be/Prww8NdNQIo)

▶ **[Watch how it was built](https://youtu.be/Prww8NdNQIo)**, including the 82 minutes Qwen 3.8 spent thinking before it wrote a line of code, and the one sentence that fixed it.

A browser Minecraft clone (voxel world, block placing and mining, first-person controls) **written entirely by Qwen 3.8 27B running locally** on a MacBook Pro M5 (32GB). No cloud, no API keys.

**Play it:** https://vikramjitsarkar.github.io/qwen3.8-minecraft/

## Run locally

```bash
npm install
npm run dev
```

Built with [Three.js](https://threejs.org/) and [Vite](https://vitejs.dev/).

## How it was made

- **Model:** Qwen 3.8 27B, 4-bit quantized (about 16GB)
- **Machine:** MacBook Pro M5 (base chip), 32GB unified memory
- **Coding agent:** OpenCode, fully local
- **Prompt:** a single short prompt asking it to make Minecraft

### If you try this yourself

Qwen 3.8 27B tends to reason about its own reasoning in a loop until the context fills, and never writes code. A bigger context window doesn't fix it. If it stalls, interrupt it and say:

> You're stuck in a loop reasoning with yourself. Stop thinking and start coding.

It starts writing immediately.

---

Made for the video [Qwen 3.8 27B: "Opus-Level" Local LLM? 3 Days on a 32GB MacBook](https://youtu.be/Prww8NdNQIo) on the [IamVikramjit](https://www.youtube.com/@IamVikramjit) channel. Local AI tested on the hardware most people actually own.
