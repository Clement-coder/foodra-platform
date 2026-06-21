export function getOrderState(order: { status: string }) {
  return order.status
}

export function getOrderStateColor(status: string): string {
  switch (status) {
    case 'Pending':    return 'text-amber-600'
    case 'Processing': return 'text-sky-600'
    case 'Shipped':    return 'text-violet-600'
    case 'Delivered':  return 'text-emerald-600'
    case 'Cancelled':  return 'text-red-600'
    default:           return 'text-muted-foreground'
  }
}
