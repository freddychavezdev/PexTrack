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

  return <aside className="detail-drawer fixed inset-x-0 bottom-0 z-30 max-h-[82vh] overflow-auto rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 md:inset-y-20 md:right-0 md:left-auto md:w-[390px] md:rounded-none md:p-6">
    <div className="drawer-grip md:hidden" /><button aria-label="Cerrar" onClick={onClose} className="icon-button absolute right-4 top-4"><X size={20} /></button>
    {crew && <section><p className="drawer-kicker">Cuadrilla</p><h2 className="drawer-title">{crew.nombre}</h2><dl className="drawer-facts"><div><dt>Vehículo</dt><dd>{crew.placa_vehiculo}</dd></div><div><dt>Técnicos</dt><dd>{crew.tecnico_1_nombre} · {crew.tecnico_2_nombre}</dd></div><div><dt>Estado</dt><dd className="capitalize">{crew.estado_operativo.replace('_', ' ')}</dd></div></dl></section>}
    {order && <section><p className="drawer-kicker">Orden de trabajo</p><h2 className="drawer-title">{order.codigo_ot}</h2><p className="mt-1 text-sm text-slate-500">{order.cliente_nombre} <span aria-hidden="true">·</span> {order.cliente_telefono}</p><div className="order-location"><p>{order.direccion_referencial}</p><span>{order.tipo_tarea}</span></div>{editable ? <div className="mt-6 grid gap-4"><label className="form-label">Estado<select value={estado} disabled={saving} onChange={e => setEstado(e.target.value as WorkOrderStatus)} className="form-input">{statuses.map(s => <option key={s} value={s}>{statusMeta[s].label}</option>)}</select></label><label className="form-label">Cuadrilla<select value={crewId} disabled={saving} onChange={e => setCrewId(e.target.value)} className="form-input"><option value="">Sin asignar</option>{crews.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>{estado === 'suspendido' && <label className="form-label">Motivo de suspensión<textarea required disabled={saving} value={motivo} onChange={e => setMotivo(e.target.value)} className="form-input min-h-24 resize-y" placeholder="Explica el motivo" /></label>}<button disabled={!canSave} onClick={() => void save()} className="primary-button mt-1">{saving ? 'Guardando…' : 'Guardar cambios'}</button></div> : <p className="mt-6 rounded-xl bg-slate-100 p-3 text-sm leading-6 text-slate-500 dark:bg-slate-800">Tu rol permite consultar esta orden, sin realizar cambios.</p>}</section>}
  </aside>
}
