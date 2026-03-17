import { useRef, useEffect } from 'react'
import * as THREE from 'three'

const COUNT = 8000

function genSphere(count, size) {
  const pts = new Float32Array(count * 3)
  const phi = Math.PI * (Math.sqrt(5) - 1)
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const t = phi * i
    pts[i * 3] = Math.cos(t) * r * size
    pts[i * 3 + 1] = y * size
    pts[i * 3 + 2] = Math.sin(t) * r * size
  }
  return pts
}

function genTorus(count, size) {
  const pts = new Float32Array(count * 3)
  const R = size * 0.7, r = size * 0.3
  for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 2
    const p = Math.random() * Math.PI * 2
    pts[i * 3] = (R + r * Math.cos(p)) * Math.cos(t)
    pts[i * 3 + 1] = r * Math.sin(p)
    pts[i * 3 + 2] = (R + r * Math.cos(p)) * Math.sin(t)
  }
  return pts
}

export default function ParticleSphere() {
  const mountRef = useRef(null)
  const frameRef = useRef(0)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x0a0a0f, 0.025)

    const camera = new THREE.PerspectiveCamera(70, mount.clientWidth / mount.clientHeight, 0.1, 500)
    camera.position.set(0, 5, 28)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    mount.appendChild(renderer.domElement)

    // Starfield
    const starGeo = new THREE.BufferGeometry()
    const starVerts = []
    for (let i = 0; i < 5000; i++) {
      const v = new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(300),
        THREE.MathUtils.randFloatSpread(300),
        THREE.MathUtils.randFloatSpread(300)
      )
      if (v.length() < 80) v.setLength(80 + Math.random() * 200)
      starVerts.push(v.x, v.y, v.z)
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3))
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      size: 0.15, color: 0x6366f1, transparent: true, opacity: 0.4, sizeAttenuation: true
    })))

    // Particle shapes
    const spherePos = genSphere(COUNT, 12)
    const torusPos = genTorus(COUNT, 12)

    const geo = new THREE.BufferGeometry()
    const current = new Float32Array(spherePos)
    const colors = new Float32Array(COUNT * 3)
    const sizes = new Float32Array(COUNT)

    for (let i = 0; i < COUNT; i++) {
      const r = Math.random()
      if (r < 0.7) {
        colors[i * 3] = 0.39; colors[i * 3 + 1] = 0.4; colors[i * 3 + 2] = 0.95 // #6366f1
      } else {
        colors[i * 3] = 0.13; colors[i * 3 + 1] = 0.83; colors[i * 3 + 2] = 0.93 // #22d3ee
      }
      sizes[i] = Math.random() * 0.12 + 0.04
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(current, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1))

    const mat = new THREE.PointsMaterial({
      size: 0.12, vertexColors: true, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
    })
    const points = new THREE.Points(geo, mat)
    scene.add(points)

    // Morph state
    let morphT = 0
    let morphDir = 1
    let isSphere = true

    const clock = new THREE.Clock()

    function animate() {
      frameRef.current = requestAnimationFrame(animate)
      const elapsed = clock.getElapsedTime()

      // Auto-morph every 4 seconds
      morphT += 0.004 * morphDir
      if (morphT >= 1) { morphDir = -1; isSphere = false }
      if (morphT <= 0) { morphDir = 1; isSphere = true }

      const t = morphT
      const pos = geo.attributes.position.array
      const src = isSphere ? torusPos : spherePos
      const dst = isSphere ? spherePos : torusPos

      for (let i = 0; i < COUNT * 3; i++) {
        pos[i] = src[i] + (dst[i] - src[i]) * t + Math.sin(elapsed * 0.3 + i * 0.001) * 0.08
      }
      geo.attributes.position.needsUpdate = true

      points.rotation.y = elapsed * 0.05
      points.rotation.x = Math.sin(elapsed * 0.02) * 0.1

      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className="absolute inset-0 z-0" style={{ background: '#0a0a0f' }} />
}
