import * as THREE from 'three';

const EYE_HEIGHT = 1.62;
const HALF = 0.3;
const HEIGHT = 1.8;
const GRAVITY = 24;
const JUMP_SPEED = 8.2;
const WALK_SPEED = 4.3;
const SPRINT_SPEED = 5.6;
const FLY_SPEED = 10;

export class Player {
  constructor(camera, world) {
    this.camera = camera;
    this.world = world;
    this.position = new THREE.Vector3(8, 40, 8);
    this.velocity = new THREE.Vector3();
    this.onGround = false;
    this.flying = false;
    this.yaw = 0;
    this.pitch = 0;
    this.keys = {};
  }

  spawn() {
    const sx = 8;
    const sz = 8;
    this.position.set(sx + 0.5, this.world.surfaceY(sx, sz) + 1, sz + 0.5);
    this.velocity.set(0, 0, 0);
  }

  keyDown(code) {
    this.keys[code] = true;
  }

  keyUp(code) {
    this.keys[code] = false;
  }

  mouseLook(dx, dy) {
    this.yaw -= dx * 0.0022;
    this.pitch -= dy * 0.0022;
    const limit = Math.PI / 2 - 0.01;
    this.pitch = Math.max(-limit, Math.min(limit, this.pitch));
  }

  collides(pos) {
    const minX = Math.floor(pos.x - HALF);
    const maxX = Math.floor(pos.x + HALF);
    const minY = Math.floor(pos.y);
    const maxY = Math.floor(pos.y + HEIGHT);
    const minZ = Math.floor(pos.z - HALF);
    const maxZ = Math.floor(pos.z + HALF);
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          if (this.world.getBlock(x, y, z) !== 0) return true;
        }
      }
    }
    return false;
  }

  update(dt) {
    const forward = (this.keys['KeyW'] ? 1 : 0) - (this.keys['KeyS'] ? 1 : 0);
    const strafe = (this.keys['KeyD'] ? 1 : 0) - (this.keys['KeyA'] ? 1 : 0);

    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const fx = -sin;
    const fz = -cos;
    const rx = cos;
    const rz = -sin;

    let speed = this.flying ? FLY_SPEED : this.keys['ShiftLeft'] ? SPRINT_SPEED : WALK_SPEED;
    let vx = (fx * forward + rx * strafe) * speed;
    let vz = (fz * forward + rz * strafe) * speed;
    let vy;

    if (this.flying) {
      vy = (this.keys['Space'] ? 1 : 0) * FLY_SPEED - (this.keys['ShiftLeft'] ? 1 : 0) * FLY_SPEED;
    } else {
      vy = this.velocity.y - GRAVITY * dt;
      if (this.keys['Space'] && this.onGround) {
        vy = JUMP_SPEED;
        this.onGround = false;
      }
    }

    this.velocity.y = vy;

    const next = this.position.clone();

    next.x += vx * dt;
    if (this.collides(next)) {
      next.x = this.position.x;
      this.velocity.x = 0;
    }

    next.z += vz * dt;
    if (this.collides(next)) {
      next.z = this.position.z;
      this.velocity.z = 0;
    }

    next.y += vy * dt;
    this.onGround = false;
    if (this.collides(next)) {
      if (vy < 0) this.onGround = true;
      next.y = this.position.y;
      this.velocity.y = 0;
    } else if (vy < -0.1) {
      this.velocity.y = vy;
    }

    if (next.y < -10) {
      this.spawn();
      return;
    }

    this.position.copy(next);

    this.camera.position.set(this.position.x, this.position.y + EYE_HEIGHT, this.position.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }
}
