// Helper function to determine the true order state based on both status and escrow
export function getOrderState(order: { status: string; escrowStatus: string }) {
  // Escrow status takes precedence for financial states
  if (order.escrowStatus === 'disputed') return 'Disputed'
  if (order.escrowStatus === 'refunded') return 'Refunded' 
  if (order.escrowStatus === 'locked' && order.status === 'Cancelled') return 'Cancelled (Locked)'
  
  // Standard order status for non-financial states
  if (order.status === 'Delivered') return 'Delivered'
  if (order.status === 'Shipped') return 'Shipped'
  if (order.status === 'Processing') return 'Processing'
  if (order.status === 'Cancelled') return 'Cancelled'
  
  // Default to pending if no clear state
  return 'Pending'
}

export function getOrderStateColor(state: string) {
  switch (state) {
    case 'Delivered': return 'text-green-600 bg-green-50'
    case 'Shipped': return 'text-blue-600 bg-blue-50'
    case 'Processing': return 'text-yellow-600 bg-yellow-50'
    case 'Disputed': return 'text-red-600 bg-red-50'
    case 'Refunded': return 'text-gray-600 bg-gray-50'
    case 'Cancelled': 
    case 'Cancelled (Locked)': return 'text-red-600 bg-red-50'
    default: return 'text-gray-600 bg-gray-50'
  }
}
