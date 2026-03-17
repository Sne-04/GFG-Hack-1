import { useRef, useEffect } from 'react'

export default function ParticleBackground({ count = 50 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    let W, H, animId
    const pts = []

    function resize() {
      W = cvs.width = window.innerWidth
      H = cvs.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < count; i++) {
      pts.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.2 + 0.3,
        dx: (Math.random() - 0.5) * 0.2,
        dy: (Math.random() - 0.5) * 0.2,
        o: Math.random() * 0.2 + 0.05
      })
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)
      pts.forEach(p => {
        p.x += p.dx; p.y += p.dy
        if (p.x < 0 || p.x > W) p.dx *= -1
        if (p.y < 0 || p.y > H) p.dy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(99,102,241,${p.o})`
        ctx.fill()
      })
      pts.forEach((a, i) => {
        pts.slice(i + 1).forEach(b => {
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < 100) {
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(99,102,241,${0.03 * (1 - d / 100)})`
            ctx.stroke()
          }
        })
      })
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [count])

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />
}
