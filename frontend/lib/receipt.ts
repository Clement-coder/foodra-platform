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

export function downloadReceiptImage({ title, subtitle, lines, filename }: ReceiptOptions) {
  const W = 600
  const PADDING = 40
  const LINE_H = 28
  const HEADER_H = 120
  const FOOTER_H = 60
  const H = HEADER_H + lines.length * LINE_H + 60 + FOOTER_H

  const canvas = document.createElement("canvas")
  canvas.width = W * 2   // 2x for retina
  canvas.height = H * 2
  canvas.style.width = `${W}px`
  canvas.style.height = `${H}px`
  const ctx = canvas.getContext("2d")!
  ctx.scale(2, 2)

  // Background
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, W, H)

  // Green header bar
  ctx.fillStyle = "#118C4C"
  ctx.fillRect(0, 0, W, HEADER_H)

  // Logo circle
  ctx.fillStyle = "rgba(255,255,255,0.15)"
  ctx.beginPath()
  ctx.arc(PADDING + 22, HEADER_H / 2, 22, 0, Math.PI * 2)
  ctx.fill()

  // "F" logo letter
  ctx.fillStyle = "#ffffff"
  ctx.font = "bold 26px sans-serif"
  ctx.textAlign = "center"
  ctx.fillText("F", PADDING + 22, HEADER_H / 2 + 9)

  // Title
  ctx.textAlign = "left"
  ctx.font = "bold 22px sans-serif"
  ctx.fillStyle = "#ffffff"
  ctx.fillText("Foodra", PADDING + 56, HEADER_H / 2 - 6)

  ctx.font = "13px sans-serif"
  ctx.fillStyle = "rgba(255,255,255,0.75)"
  ctx.fillText(subtitle, PADDING + 56, HEADER_H / 2 + 14)

  // Receipt title top-right
  ctx.textAlign = "right"
  ctx.font = "bold 14px sans-serif"
  ctx.fillStyle = "rgba(255,255,255,0.9)"
  ctx.fillText(title, W - PADDING, HEADER_H / 2 + 6)

  // Divider
  ctx.strokeStyle = "#e5e7eb"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(PADDING, HEADER_H + 20)
  ctx.lineTo(W - PADDING, HEADER_H + 20)
  ctx.stroke()

  // Lines
  let y = HEADER_H + 48
  for (const line of lines) {
    const isTotal = line.bold && line.green

    if (isTotal) {
      // Total row background
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

    // Dotted separator for non-total, non-small lines
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

  // Download
  canvas.toBlob((blob) => {
    if (!blob) return
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `${filename}.png`
    a.click()
    URL.revokeObjectURL(a.href)
  }, "image/png")
}

// Mask sensitive data: show first 2 + last 2 chars
export function maskSensitive(value: string): string {
  if (!value || value.length <= 6) return "••••••"
  return value.slice(0, 3) + "•".repeat(Math.min(value.length - 5, 8)) + value.slice(-3)
}
