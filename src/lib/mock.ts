import type { Crew, WorkOrder } from '../types'
const now = () => new Date().toISOString()
export const demoCrews: Crew[] = Array.from({ length: 7 }, (_, i) => ({
  id: `crew-${i + 1}`, nombre: `Cuadrilla ${i + 1}`, placa_vehiculo: `PEX-${120 + i}`,
  tecnico_1_nombre: `Técnico ${i * 2 + 1}`, tecnico_2_nombre: `Técnico ${i * 2 + 2}`,
  lat: -16.50 + (i % 3) * 0.018, lng: -68.14 - Math.floor(i / 3) * 0.022, heading: (i * 48) % 360,
  estado_operativo: 'activo', ultima_actualizacion: now(),
}))
const states: WorkOrder['estado'][] = ['pendiente', 'en_camino', 'en_sitio', 'finalizado', 'suspendido']
export const demoOrders: WorkOrder[] = Array.from({ length: 14 }, (_, i) => ({
  id: `ot-${i + 1}`, codigo_ot: `OT-2026-${String(i + 1).padStart(3, '0')}`, cliente_nombre: `Cliente ${i + 1}`,
  cliente_telefono: `+591 7${String(1000000 + i).slice(1)}`, direccion_referencial: `Zona ${['Sopocachi', 'Miraflores', 'El Alto', 'Calacoto'][i % 4]}`,
  tipo_tarea: ['Instalación', 'Asistencia técnica', 'Traslado'][i % 3], estado: states[i % states.length], cuadrilla_id: i < 10 ? `crew-${(i % 7) + 1}` : null,
  fecha_programada: new Date().toISOString().slice(0, 10), motivo_postergacion: i % 5 === 4 ? 'Cliente solicitó reprogramación' : null,
  lat: -16.49 + (i % 5) * 0.012, lng: -68.16 + Math.floor(i / 5) * 0.018,
}))
const stableCrewOffset = (id: string) => Array.from(id).reduce((total, character) => total + character.charCodeAt(0), 0)

export const advanceCrew = (crew: Crew, step: number): Crew => {
  const offset = stableCrewOffset(crew.id)
  return { ...crew, lat: crew.lat + Math.sin(step + offset) * 0.0007, lng: crew.lng + Math.cos(step + offset) * 0.0007, heading: (crew.heading + 22) % 360, ultima_actualizacion: now() }
}
