import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Crew, Role, WorkOrder, WorkOrderStatus } from '../types'
import { canManageOrders, statusMeta } from '../lib/domain'

const statuses: WorkOrderStatus[] = ['pendiente', 'en_camino', 'en_sitio', 'finalizado', 'suspendido']
type OrderPatch = { estado: WorkOrderStatus; motivo_postergacion?: string | null; cuadrilla_id?: string | null }

export function DetailDrawer({ order, crew, crews, role, onClose, onSave }: { order?: WorkOrder; crew?: Crew; crews: Crew[]; role: Role; onClose: () => void; onSave: (patch: OrderPatch) => Promise<void> }) {
  const [estado, setEstado] = useState<WorkOrderStatus>(order?.estado ?? 'pendiente')
  const [motivo, setMotivo] = useState(order?.motivo_postergacion ?? '')
  const [crewId, setCrewId] = useState(order?.cuadrilla_id ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setEstado(order?.estado ?? 'pendiente')
    setMotivo(order?.motivo_postergacion ?? '')
    setCrewId(order?.cuadrilla_id ?? '')
  }, [order?.id, order?.estado, order?.motivo_postergacion, order?.cuadrilla_id])

  if (!order && !crew) return null
  const editable = canManageOrders(role)
  const canSave = !saving && (estado !== 'suspendido' || Boolean(motivo.trim()))
  const save = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await onSave({ estado, cuadrilla_id: crewId || null, motivo_postergacion: estado === 'suspendido' ? motivo.trim() : null })
    } finally {
      setSaving(false)
    }
  }

  return <aside className="fixed inset-x-0 bottom-0 z-30 max-h-[82vh] overflow-auto rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 md:inset-y-16 md:right-0 md:left-auto md:w-[390px] md:rounded-none">
    <button aria-label="Cerrar" onClick={onClose} className="absolute right-4 top-4 rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20} /></button>
    {crew && <section><p className="text-sm font-medium text-blue-600">CUADRILLA</p><h2 className="mt-1 text-xl font-bold">{crew.nombre}</h2><dl className="mt-5 grid gap-3 text-sm"><div><dt className="text-slate-500">Vehículo</dt><dd>{crew.placa_vehiculo}</dd></div><div><dt className="text-slate-500">Técnicos</dt><dd>{crew.tecnico_1_nombre} · {crew.tecnico_2_nombre}</dd></div><div><dt className="text-slate-500">Estado</dt><dd className="capitalize">{crew.estado_operativo.replace('_', ' ')}</dd></div></dl></section>}
    {order && <section><p className="text-sm font-medium text-blue-600">ORDEN DE TRABAJO</p><h2 className="mt-1 text-xl font-bold">{order.codigo_ot}</h2><p className="mt-1 text-slate-500">{order.cliente_nombre} · {order.cliente_telefono}</p><p className="mt-4 rounded bg-slate-100 p-3 text-sm dark:bg-slate-800">{order.direccion_referencial}<br /><span className="text-slate-500">{order.tipo_tarea}</span></p>{editable ? <div className="mt-5 grid gap-4"><label className="text-sm font-medium">Estado<select value={estado} disabled={saving} onChange={e => setEstado(e.target.value as WorkOrderStatus)} className="mt-1 w-full rounded border border-slate-300 bg-transparent p-2 disabled:opacity-60 dark:border-slate-600">{statuses.map(s => <option key={s} value={s}>{statusMeta[s].label}</option>)}</select></label><label className="text-sm font-medium">Cuadrilla<select value={crewId} disabled={saving} onChange={e => setCrewId(e.target.value)} className="mt-1 w-full rounded border border-slate-300 bg-transparent p-2 disabled:opacity-60 dark:border-slate-600"><option value="">Sin asignar</option>{crews.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>{estado === 'suspendido' && <label className="text-sm font-medium">Motivo de suspensión<textarea required disabled={saving} value={motivo} onChange={e => setMotivo(e.target.value)} className="mt-1 w-full rounded border border-slate-300 bg-transparent p-2 disabled:opacity-60 dark:border-slate-600" /></label>}<button disabled={!canSave} onClick={() => void save()} className="rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar cambios'}</button></div> : <p className="mt-5 text-sm text-slate-500">Tu rol permite solo consulta de esta orden.</p>}</section>}
  </aside>
}
