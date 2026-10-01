import * as THREE from 'three'
import { World, WORLD_CHUNKS, CHUNK } from './world.js'
import { buildAtlas, buildChunkGeometry, chunkKey } from './mesher.js'
import { Player } from './player.js'
import { raycast } from './ray.js'
import { AIR, BLOCKS, HOTBAR, getBlockIcon } from './blocks.js'

const world = new World(1337)

const atlas = buildAtlas()
const material = new THREE.MeshBasicMaterial({ map: atlas.texture, vertexColors: true })

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x87ceeb)
scene.fog = new THREE.Fog(0x87ceeb, 60, 110)

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 300)
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
document.body.appendChild(renderer.domElement)

const player = new Player(camera, world)
player.spawn()

const chunks = new Map()
function rebuildChunk(cx, cz) {
  const key = chunkKey(cx, cz)
  const old = chunks.get(key)
  if (old) {
    scene.remove(old)
    old.geometry.dispose()
  }
  const geo = buildChunkGeometry(world, cx, cz, atlas.uv)
  if (!geo) {
    chunks.delete(key)
    return
  }
  const mesh = new THREE.Mesh(geo, material)
  scene.add(mesh)
  chunks.set(key, mesh)
}

for (let cx = 0; cx < WORLD_CHUNKS; cx++)
  for (let cz = 0; cz < WORLD_CHUNKS; cz++)
    rebuildChunk(cx, cz)

const outline = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002)),
  new THREE.LineBasicMaterial({ color: 0x111111 })
)
outline.visible = false
scene.add(outline)

function affectedChunks(x, z) {
  const cx = Math.floor(x / CHUNK)
  const cz = Math.floor(z / CHUNK)
  const set = new Set([chunkKey(cx, cz)])
  if (x % CHUNK === 0) set.add(chunkKey(cx - 1, cz))
  if (x % CHUNK === CHUNK - 1) set.add(chunkKey(cx + 1, cz))
  if (z % CHUNK === 0) set.add(chunkKey(cx, cz - 1))
  if (z % CHUNK === CHUNK - 1) set.add(chunkKey(cx, cz + 1))
  if (x % CHUNK === 0 && z % CHUNK === 0) set.add(chunkKey(cx - 1, cz - 1))
  if (x % CHUNK === 0 && z % CHUNK === CHUNK - 1) set.add(chunkKey(cx - 1, cz + 1))
  if (x % CHUNK === CHUNK - 1 && z % CHUNK === 0) set.add(chunkKey(cx + 1, cz - 1))
  if (x % CHUNK === CHUNK - 1 && z % CHUNK === CHUNK - 1) set.add(chunkKey(cx + 1, cz + 1))
  return set
}

function setBlock(x, y, z, id) {
  world.setBlock(x, y, z, id)
  for (const key of affectedChunks(x, z)) {
    const [cx, cz] = key.split(',').map(Number)
    rebuildChunk(cx, cz)
  }
}

const hotbarEl = document.getElementById('hotbar')
const slots = []
HOTBAR.forEach((id, i) => {
  const slot = document.createElement('div')
  slot.className = 'slot'
  const icon = document.createElement('img')
  icon.className = 'icon'
  icon.src = getBlockIcon(id, 36).toDataURL()
  const num = document.createElement('span')
  num.className = 'num'
  num.textContent = i + 1
  slot.append(icon, num)
  hotbarEl.appendChild(slot)
  slots.push(slot)
})

let selected = 0
function selectSlot(i) {
  selected = (i + HOTBAR.length) % HOTBAR.length
  slots.forEach((s, j) => s.classList.toggle('selected', j === selected))
}
selectSlot(0)

let locked = false
const overlay = document.getElementById('overlay')
const rayDir = new THREE.Vector3()

overlay.addEventListener('click', () => {
  renderer.domElement.requestPointerLock()
})

document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === renderer.domElement
  overlay.classList.toggle('hidden', locked)
  if (locked) player.keys = {}
})

document.addEventListener('mousemove', (e) => {
  if (locked) player.mouseLook(e.movementX, e.movementY)
})

document.addEventListener('keydown', (e) => {
  player.keyDown(e.code)
  if (e.code === 'KeyF') player.flying = !player.flying
  if (e.code.startsWith('Digit')) {
    const n = Number(e.code.slice(5))
    if (n >= 1 && n <= HOTBAR.length) selectSlot(n - 1)
  }
})

document.addEventListener('keyup', (e) => {
  player.keyUp(e.code)
})

function intersectsPlayer(x, y, z) {
  const p = player.position
  return (
    x + 1 > p.x - 0.3 && x < p.x + 0.3 &&
    y + 1 > p.y && y < p.y + 1.8 &&
    z + 1 > p.z - 0.3 && z < p.z + 0.3
  )
}

document.addEventListener('mousedown', (e) => {
  if (!locked) return
  camera.getWorldDirection(rayDir)
  const hit = raycast(world, camera.position, rayDir, 6)
  if (!hit) return
  if (e.button === 0) {
    if (hit.y > 0) setBlock(hit.x, hit.y, hit.z, AIR)
  } else if (e.button === 2) {
    const bx = hit.x + hit.normal.x
    const by = hit.y + hit.normal.y
    const bz = hit.z + hit.normal.z
    if (world.getBlock(bx, by, bz) === AIR && !intersectsPlayer(bx, by, bz)) {
      setBlock(bx, by, bz, HOTBAR[selected])
    }
  }
})

document.addEventListener('contextmenu', (e) => e.preventDefault())

document.addEventListener('wheel', (e) => {
  if (locked) selectSlot(selected + (e.deltaY > 0 ? 1 : -1))
})

const clock = new THREE.Clock()
function loop() {
  requestAnimationFrame(loop)
  const dt = Math.min(clock.getDelta(), 0.05)
  if (locked) player.update(dt)
  if (locked) {
    camera.getWorldDirection(rayDir)
    const hit = raycast(world, camera.position, rayDir, 6)
    if (hit) {
      outline.visible = true
      outline.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5)
    } else {
      outline.visible = false
    }
  } else {
    outline.visible = false
  }
  renderer.render(scene, camera)
}
loop()

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
})
