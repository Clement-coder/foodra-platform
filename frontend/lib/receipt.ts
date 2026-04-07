interface ReceiptLine {
  label: string
  value: string
  bold?: boolean
  green?: boolean
  small?: boolean
}

interface ReceiptOptions {
  title: string
  subtitle: string
  lines: ReceiptLine[]
  filename: string
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Unique receipt fingerprint — timestamp + random hex
function genReceiptId(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `FDR-${ts}-${rand}`
}

// Draw torn/perforated edge between header and body
function drawTornEdge(ctx: CanvasRenderingContext2D, y: number, W: number) {
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(0, y)
  const steps = 30
  for (let i = 0; i <= steps; i++) {
    const x = (W / steps) * i
    const dy = i % 2 === 0 ? y - 5 : y + 5
    ctx.lineTo(x, dy)
  }
  ctx.lineTo(W, y + 20)
  ctx.lineTo(W, y)
  ctx.closePath()
  ctx.fillStyle = "#118C4C"
  ctx.fill()
  ctx.restore()
}

// Draw diagonal watermark text
function drawWatermark(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.save()
  ctx.globalAlpha = 0.04
  ctx.font = "bold 52px sans-serif"
  ctx.fillStyle = "#118C4C"
  ctx.translate(W / 2, H / 2)
  ctx.rotate(-Math.PI / 6)
  ctx.textAlign = "center"
  ctx.fillText("FOODRA", 0, 0)
  ctx.fillText("FOODRA", 0, 80)
  ctx.fillText("FOODRA", 0, -80)
  ctx.restore()
}

// Draw subtle dot-grid background pattern
function drawDotGrid(ctx: CanvasRenderingContext2D, W: number, H: number, startY: number) {
  ctx.save()
  ctx.globalAlpha = 0.06
  ctx.fillStyle = "#118C4C"
  const spacing = 18
  for (let x = spacing; x < W; x += spacing) {
    for (let y = startY + spacing; y < H; y += spacing) {
      ctx.beginPath()
      ctx.arc(x, y, 1, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

// Draw perforated dashed line (like a real receipt tear line)
function drawPerforated(ctx: CanvasRenderingContext2D, y: number, W: number, PADDING: number) {
  ctx.save()
  ctx.strokeStyle = "#d1fae5"
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 6])
  ctx.beginPath()
  ctx.moveTo(PADDING, y)
  ctx.lineTo(W - PADDING, y)
  ctx.stroke()
  ctx.setLineDash([])
  // Small circles at ends
  ctx.fillStyle = "#e5e7eb"
  ctx.beginPath(); ctx.arc(PADDING - 8, y, 5, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(W - PADDING + 8, y, 5, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

export async function downloadReceiptImage({ title, subtitle, lines, filename }: ReceiptOptions) {
  const W = 600
  const PADDING = 44
  const LINE_H = 30
  const HEADER_H = 130
  const FOOTER_H = 80
  const receiptId = genReceiptId()
  const H = HEADER_H + 30 + lines.length * LINE_H + 80 + FOOTER_H

  const canvas = document.createElement("canvas")
  canvas.width = W * 2
  canvas.height = H * 2
  const ctx = canvas.getContext("2d")!
  ctx.scale(2, 2)

  // ── Background with subtle warm tint ──
  ctx.fillStyle = "#fafffe"
  ctx.fillRect(0, 0, W, H)

  // Dot grid on body
  drawDotGrid(ctx, W, H, HEADER_H)

  // ── Header gradient ──
  const grad = ctx.createLinearGradient(0, 0, W, HEADER_H)
  grad.addColorStop(0, "#0d6d3a")
  grad.addColorStop(0.6, "#118C4C")
  grad.addColorStop(1, "#16a35a")
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, HEADER_H)

  // Decorative circles in header (subtle)
  ctx.save()
  ctx.globalAlpha = 0.08
  ctx.fillStyle = "#ffffff"
  ctx.beginPath(); ctx.arc(W - 40, -20, 80, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(W - 10, HEADER_H + 10, 50, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(20, HEADER_H - 10, 40, 0, Math.PI * 2); ctx.fill()
  ctx.restore()

  // ── Logo on white pill ──
  try {
    const logo = await loadImage("/foodra_logo.jpeg")
    const logoH = 56
    const logoW = Math.round((logo.width / logo.height) * logoH)
    const lx = PADDING
    const ly = (HEADER_H - logoH) / 2

    // White pill background
    ctx.save()
    ctx.shadowColor = "rgba(0,0,0,0.15)"
    ctx.shadowBlur = 8
    ctx.fillStyle = "#ffffff"
    const pillPad = 6
    ctx.beginPath()
    ctx.roundRect(lx - pillPad, ly - pillPad, logoW + pillPad * 2, logoH + pillPad * 2, 12)
    ctx.fill()
    ctx.restore()

    // Logo clipped to rounded rect
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(lx, ly, logoW, logoH, 8)
    ctx.clip()
    ctx.drawImage(logo, lx, ly, logoW, logoH)
    ctx.restore()

    // "Foodra" wordmark
    ctx.font = "bold 24px sans-serif"
    ctx.fillStyle = "#ffffff"
    ctx.textAlign = "left"
    ctx.fillText("Foodra", lx + logoW + 16, HEADER_H / 2 - 6)
    ctx.font = "12px sans-serif"
    ctx.fillStyle = "rgba(255,255,255,0.7)"
    ctx.fillText("Agricultural Platform", lx + logoW + 16, HEADER_H / 2 + 12)
  } catch {
    ctx.font = "bold 24px sans-serif"
    ctx.fillStyle = "#ffffff"
    ctx.textAlign = "left"
    ctx.fillText("Foodra", PADDING, HEADER_H / 2 + 8)
  }

  // Receipt type badge (top right)
  ctx.save()
  ctx.fillStyle = "rgba(255,255,255,0.18)"
  ctx.beginPath()
  ctx.roundRect(W - PADDING - 90, HEADER_H / 2 - 22, 90, 44, 10)
  ctx.fill()
  ctx.font = "bold 11px sans-serif"
  ctx.fillStyle = "#ffffff"
  ctx.textAlign = "center"
  ctx.fillText(title, W - PADDING - 45, HEADER_H / 2 - 4)
  ctx.font = "10px sans-serif"
  ctx.fillStyle = "rgba(255,255,255,0.7)"
  ctx.fillText(new Date().toLocaleDateString("en-NG"), W - PADDING - 45, HEADER_H / 2 + 12)
  ctx.restore()

  // ── Torn edge ──
  drawTornEdge(ctx, HEADER_H, W)

  // ── Body ──
  let y = HEADER_H + 44

  // Watermark behind content
  drawWatermark(ctx, W, H)

  // Lines
  for (const line of lines) {
    if (!line.label && !line.value) { y += 10; continue }
    const isTotal = line.bold && line.green

    if (isTotal) {
      // Total highlight pill
      ctx.save()
      const grad2 = ctx.createLinearGradient(PADDING - 10, 0, W - PADDING + 10, 0)
      grad2.addColorStop(0, "#dcfce7")
      grad2.addColorStop(1, "#f0fdf4")
      ctx.fillStyle = grad2
      ctx.beginPath()
      ctx.roundRect(PADDING - 10, y - 20, W - PADDING * 2 + 20, LINE_H + 6, 8)
      ctx.fill()
      ctx.restore()
    }

    ctx.textAlign = "left"
    ctx.font = line.bold ? "bold 14px sans-serif" : line.small ? "11px sans-serif" : "13px sans-serif"
    ctx.fillStyle = line.small ? "#9ca3af" : line.green ? "#118C4C" : "#374151"
    ctx.fillText(line.label, PADDING, y)

    ctx.textAlign = "right"
    ctx.font = line.bold ? "bold 14px sans-serif" : line.small ? "11px sans-serif" : "13px sans-serif"
    ctx.fillStyle = line.green ? "#0d6d3a" : line.bold ? "#111827" : "#374151"
    ctx.fillText(line.value, W - PADDING, y)

    if (!line.small && !isTotal) {
      ctx.strokeStyle = "#e5e7eb"
      ctx.setLineDash([3, 5])
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.moveTo(PADDING, y + 9)
      ctx.lineTo(W - PADDING, y + 9)
      ctx.stroke()
      ctx.setLineDash([])
    }

    y += LINE_H
  }

  // ── Perforated tear line before footer ──
  const tearY = H - FOOTER_H - 10
  drawPerforated(ctx, tearY, W, PADDING)

  // ── Footer ──
  ctx.fillStyle = "#f0fdf4"
  ctx.fillRect(0, tearY + 10, W, FOOTER_H + 10)

  // Unique receipt ID
  ctx.textAlign = "center"
  ctx.font = "bold 11px monospace"
  ctx.fillStyle = "#118C4C"
  ctx.fillText(receiptId, W / 2, tearY + 32)

  // Barcode-style lines (decorative, unique per receipt)
  const seed = receiptId.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  ctx.save()
  ctx.globalAlpha = 0.5
  const barX = W / 2 - 80
  for (let i = 0; i < 40; i++) {
    const w = ((seed * (i + 7) * 13) % 4) + 1
    const gap = ((seed * (i + 3) * 7) % 3) + 1
    const h = 18 + ((seed * (i + 11)) % 8)
    ctx.fillStyle = "#118C4C"
    ctx.fillRect(barX + i * (w + gap), tearY + 42, w, h)
  }
  ctx.restore()

  ctx.font = "10px sans-serif"
  ctx.fillStyle = "#9ca3af"
  ctx.textAlign = "center"
  ctx.fillText("foodra.app  •  Verified Foodra Receipt", W / 2, tearY + 72)

  canvas.toBlob((blob) => {
    if (!blob) return
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `${filename}.png`
    a.click()
    URL.revokeObjectURL(a.href)
  }, "image/png")
}

// Mask sensitive data
export function maskSensitive(value: string): string {
  if (!value || value.length <= 6) return "••••••"
  return value.slice(0, 3) + "•".repeat(Math.min(value.length - 5, 8)) + value.slice(-3)
}
