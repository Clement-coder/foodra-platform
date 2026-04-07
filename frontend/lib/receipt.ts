// Generates a receipt PNG using Canvas and triggers download

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

export async function downloadReceiptImage({ title, subtitle, lines, filename }: ReceiptOptions) {
  const W = 600
  const PADDING = 40
  const LINE_H = 28
  const HEADER_H = 120
  const FOOTER_H = 60
  const H = HEADER_H + lines.length * LINE_H + 60 + FOOTER_H

  const canvas = document.createElement("canvas")
  canvas.width = W * 2
  canvas.height = H * 2
  const ctx = canvas.getContext("2d")!
  ctx.scale(2, 2)

  // Background
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, W, H)

  // Green header bar
  ctx.fillStyle = "#118C4C"
  ctx.fillRect(0, 0, W, HEADER_H)

  // Draw real logo
  try {
    const logo = await loadImage("/foodra_logo.jpeg")
    const logoH = 52
    const logoW = Math.round((logo.width / logo.height) * logoH)
    const lx = PADDING
    const ly = (HEADER_H - logoH) / 2
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(lx, ly, logoW, logoH, 8)
    ctx.clip()
    ctx.drawImage(logo, lx, ly, logoW, logoH)
    ctx.restore()

    ctx.font = "bold 22px sans-serif"
    ctx.fillStyle = "#ffffff"
    ctx.textAlign = "left"
    ctx.fillText("Foodra", lx + logoW + 12, HEADER_H / 2 - 4)
    ctx.font = "13px sans-serif"
    ctx.fillStyle = "rgba(255,255,255,0.75)"
    ctx.fillText(subtitle, lx + logoW + 12, HEADER_H / 2 + 14)
  } catch {
    ctx.font = "bold 22px sans-serif"
    ctx.fillStyle = "#ffffff"
    ctx.textAlign = "left"
    ctx.fillText("Foodra", PADDING, HEADER_H / 2 + 6)
    ctx.font = "13px sans-serif"
    ctx.fillStyle = "rgba(255,255,255,0.75)"
    ctx.fillText(subtitle, PADDING, HEADER_H / 2 + 22)
  }

  // Receipt title top-right
  ctx.textAlign = "right"
  ctx.font = "bold 14px sans-serif"
  ctx.fillStyle = "rgba(255,255,255,0.9)"
  ctx.fillText(title, W - PADDING, HEADER_H / 2 + 6)

  // Divider
  ctx.strokeStyle = "#e5e7eb"
  ctx.lineWidth = 1
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(PADDING, HEADER_H + 20)
  ctx.lineTo(W - PADDING, HEADER_H + 20)
  ctx.stroke()

  // Lines
  let y = HEADER_H + 48
  for (const line of lines) {
    if (!line.label && !line.value) { y += LINE_H * 0.4; continue }
    const isTotal = line.bold && line.green

    if (isTotal) {
      ctx.fillStyle = "#f0fdf4"
      ctx.fillRect(PADDING - 8, y - 18, W - PADDING * 2 + 16, LINE_H + 4)
    }

    ctx.textAlign = "left"
    ctx.font = line.bold ? "bold 13px sans-serif" : line.small ? "11px sans-serif" : "13px sans-serif"
    ctx.fillStyle = line.small ? "#9ca3af" : line.green ? "#118C4C" : "#374151"
    ctx.fillText(line.label, PADDING, y)

    ctx.textAlign = "right"
    ctx.font = line.bold ? "bold 13px sans-serif" : line.small ? "11px sans-serif" : "13px sans-serif"
    ctx.fillStyle = line.green ? "#118C4C" : line.bold ? "#111827" : "#374151"
    ctx.fillText(line.value, W - PADDING, y)

    if (!line.small && !isTotal) {
      ctx.strokeStyle = "#f3f4f6"
      ctx.setLineDash([2, 4])
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(PADDING, y + 8)
      ctx.lineTo(W - PADDING, y + 8)
      ctx.stroke()
      ctx.setLineDash([])
    }

    y += LINE_H
  }

  // Footer
  const footerY = H - FOOTER_H + 16
  ctx.fillStyle = "#f9fafb"
  ctx.fillRect(0, H - FOOTER_H, W, FOOTER_H)
  ctx.strokeStyle = "#e5e7eb"
  ctx.lineWidth = 1
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(0, H - FOOTER_H)
  ctx.lineTo(W, H - FOOTER_H)
  ctx.stroke()
  ctx.textAlign = "center"
  ctx.font = "11px sans-serif"
  ctx.fillStyle = "#9ca3af"
  ctx.fillText("foodra.app  •  Powered by Foodra Platform", W / 2, footerY)
  ctx.fillText("Thank you for using Foodra", W / 2, footerY + 16)

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
