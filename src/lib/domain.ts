import type { Role, WorkOrderStatus } from '../types'

export const statusMeta: Record<WorkOrderStatus, { label: string; color: string; className: string }> = {
  pendiente: { label: 'Pendiente', color: '#9CA3AF', className: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100' },
  en_camino: { label: 'En camino', color: '#3B82F6', className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200' },
  en_sitio: { label: 'En sitio', color: '#F97316', className: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200' },
  finalizado: { label: 'Finalizado', color: '#22C55E', className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200' },
  suspendido: { label: 'Suspendido', color: '#EF4444', className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200' },
}
export const canManageOrders = (role: Role) => role === 'admin' || role === 'coordinador'
export const isStale = (updatedAt: string, now = Date.now()) => now - new Date(updatedAt).getTime() > 60_000
export const pointFromGeoJson = (point: { coordinates: [number, number] }) => ({ lng: point.coordinates[0], lat: point.coordinates[1] })
