import { useEffect, useRef } from 'react'

const COLS: [number, number, number][] = [
  [255, 255, 255],  // white
  [91,  158, 255],  // blue
  [167, 139, 250],  // purple
  [125, 211, 252],  // cyan
]

export default function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const mouse = { x: -9999, y: -9999 }
    let raf = 0

    // Always read from parent so we get the real CSS dimensions
    const sync = () => {
      const p = canvas.parentElement
      canvas.width  = p ? p.offsetWidth  : window.innerWidth
      canvas.height = p ? p.offsetHeight : 700
    }
    sync()

    const N = Math.min(Math.floor(canvas.width * canvas.height / 7000), 150)

    type Pt = {
      x: number; y: number; vx: number; vy: number
      r: number; a: number; rgb: [number, number, number]
    }

    const pts: Pt[] = Array.from({ length: N }, () => ({
      x:   Math.random() * canvas.width,
      y:   Math.random() * canvas.height,
      vx:  (Math.random() - 0.5) * 0.5,
      vy:  (Math.random() - 0.5) * 0.5,
      r:   Math.random() * 2.5 + 1.2,          // 1.2 – 3.7 px
      a:   Math.random() * 0.45 + 0.5,          // 0.50 – 0.95 opacity
      rgb: COLS[Math.floor(Math.random() * COLS.length)],
    }))

    const tick = () => {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)

      for (const p of pts) {
        // Repulsion from mouse — particles fly away clearly
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const d2 = dx * dx + dy * dy
        const RAD = 210

        if (d2 < RAD * RAD && d2 > 0.5) {
          const d   = Math.sqrt(d2)
          const f   = Math.pow(1 - d / RAD, 2) * 4.5   // strong push
          p.vx += (dx / d) * f * 0.06
          p.vy += (dy / d) * f * 0.06
        }

        // Speed cap + damping
        const spd = Math.hypot(p.vx, p.vy)
        if (spd > 5) { p.vx *= 5 / spd; p.vy *= 5 / spd }
        p.vx *= 0.968
        p.vy *= 0.968

        // Wrap edges
        p.x = ((p.x + p.vx) + W) % W
        p.y = ((p.y + p.vy) + H) % H

        // Draw dot
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.rgb[0]},${p.rgb[1]},${p.rgb[2]},${p.a})`
        ctx.fill()
      }

      // Draw connections
      const CONN = 105
      const CONN2 = CONN * CONN
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x
          const dy = pts[i].y - pts[j].y
          const d2 = dx * dx + dy * dy
          if (d2 < CONN2) {
            const alpha = 0.4 * (1 - Math.sqrt(d2) / CONN)
            ctx.beginPath()
            ctx.moveTo(pts[i].x, pts[i].y)
            ctx.lineTo(pts[j].x, pts[j].y)
            ctx.strokeStyle = `rgba(110,160,255,${alpha})`
            ctx.lineWidth = 0.9
            ctx.stroke()
          }
        }
      }

      raf = requestAnimationFrame(tick)
    }

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      mouse.x = e.clientX - r.left
      mouse.y = e.clientY - r.top
    }
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999 }
    const onResize = () => sync()

    tick()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseleave', onLeave)
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 4 }}
    />
  )
}
