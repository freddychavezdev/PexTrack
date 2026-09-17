import type { RealtimeChannel } from '@supabase/supabase-js'
import { demoCrews, demoOrders } from './mock'
import { supabase } from './supabase'
import type { Crew, WorkOrder, WorkOrderStatus } from '../types'

const crewFromRow = (row: any): Crew => ({ ...row, lat: Number(row.lat), lng: Number(row.lng), heading: Number(row.heading), tecnico_1_nombre: row.tecnico_1_nombre ?? 'Técnico 1', tecnico_2_nombre: row.tecnico_2_nombre ?? 'Técnico 2' })
const orderFromRow = (row: any): WorkOrder => ({ ...row, lat: Number(row.lat), lng: Number(row.lng) })
const crewFields = 'id,nombre,placa_vehiculo,heading,estado_operativo,ultima_actualizacion,lat,lng,tecnico_1_nombre,tecnico_2_nombre'
const orderFields = 'id,codigo_ot,cliente_nombre,cliente_telefono,direccion_referencial,tipo_tarea,estado,cuadrilla_id,cuadrilla_nombre,fecha_programada,motivo_postergacion,lat,lng'
export async function loadDashboard() { if (!supabase) return { crews: demoCrews, orders: demoOrders }; const [c, o] = await Promise.all([supabase.from('dashboard_crews').select(crewFields), supabase.from('dashboard_orders').select(orderFields).order('fecha_programada')]); if (c.error || o.error) throw c.error ?? o.error; return { crews: c.data.map(crewFromRow), orders: o.data.map(orderFromRow) } }
export async function updateOrder(id: string, patch: { estado: WorkOrderStatus; motivo_postergacion?: string | null; cuadrilla_id?: string | null }) { if (!supabase) return; const { error } = await supabase.from('ordenes_trabajo').update(patch).eq('id', id); if (error) throw error }
export async function reportCrewPosition(crew: Crew, otId?: string | null) { if (!supabase) return; const { error } = await supabase.rpc('report_crew_position', { p_cuadrilla_id: crew.id, p_lng: crew.lng, p_lat: crew.lat, p_heading: crew.heading, p_ot_id: otId ?? null }); if (error) throw error }
export function subscribeDashboard(onChange: () => void): (() => void) | undefined { const client = supabase; if (!client) return; const channel: RealtimeChannel = client.channel('pextrack-dashboard').on('postgres_changes', { event: '*', schema: 'public', table: 'cuadrillas' }, onChange).on('postgres_changes', { event: '*', schema: 'public', table: 'ordenes_trabajo' }, onChange).subscribe(); return () => { client.removeChannel(channel) } }
