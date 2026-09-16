import type { RealtimeChannel } from '@supabase/supabase-js'
import { demoCrews, demoOrders } from './mock'
import { supabase } from './supabase'
import type { Crew, WorkOrder, WorkOrderStatus } from '../types'

const crewFromRow = (row: any): Crew => ({ ...row, ...{ lat: row.posicion_actual?.coordinates?.[1] ?? row.lat, lng: row.posicion_actual?.coordinates?.[0] ?? row.lng }, tecnico_1_nombre: row.tecnico_1_nombre ?? 'Técnico 1', tecnico_2_nombre: row.tecnico_2_nombre ?? 'Técnico 2' })
const orderFromRow = (row: any): WorkOrder => ({ ...row, ...{ lat: row.ubicacion_cliente?.coordinates?.[1] ?? row.lat, lng: row.ubicacion_cliente?.coordinates?.[0] ?? row.lng } })
export async function loadDashboard() { if (!supabase) return { crews: demoCrews, orders: demoOrders }; const [c, o] = await Promise.all([supabase.from('dashboard_crews').select('*'), supabase.from('dashboard_orders').select('*').order('fecha_programada')]); if (c.error || o.error) throw c.error ?? o.error; return { crews: c.data.map(crewFromRow), orders: o.data.map(orderFromRow) } }
export async function updateOrder(id: string, patch: { estado: WorkOrderStatus; motivo_postergacion?: string | null; cuadrilla_id?: string | null }) { if (!supabase) return; const { error } = await supabase.from('ordenes_trabajo').update(patch).eq('id', id); if (error) throw error }
export async function updateCrewPosition(crew: Crew) { if (!supabase) return; const { error } = await supabase.from('cuadrillas').update({ posicion_actual: `POINT(${crew.lng} ${crew.lat})`, heading: crew.heading, ultima_actualizacion: crew.ultima_actualizacion, estado_operativo: 'activo' }).eq('id', crew.id); if (error) throw error }
export function subscribeDashboard(onChange: () => void): (() => void) | undefined { const client = supabase; if (!client) return; const channel: RealtimeChannel = client.channel('pextrack-dashboard').on('postgres_changes', { event: '*', schema: 'public', table: 'cuadrillas' }, onChange).on('postgres_changes', { event: '*', schema: 'public', table: 'ordenes_trabajo' }, onChange).subscribe(); return () => { client.removeChannel(channel) } }
