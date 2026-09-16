export type Role = 'admin' | 'coordinador' | 'tecnico'
export type WorkOrderStatus = 'pendiente' | 'en_camino' | 'en_sitio' | 'finalizado' | 'suspendido'
export interface Profile { id: string; nombre_completo: string; email: string; role: Role; cuadrillaId?: string }
export interface Crew { id: string; nombre: string; placa_vehiculo: string; tecnico_1_nombre: string; tecnico_2_nombre: string; lat: number; lng: number; heading: number; estado_operativo: 'activo' | 'inactivo' | 'sin_senal'; ultima_actualizacion: string }
export interface WorkOrder { id: string; codigo_ot: string; cliente_nombre: string; cliente_telefono: string; direccion_referencial: string; tipo_tarea: string; estado: WorkOrderStatus; cuadrilla_id: string | null; fecha_programada: string; motivo_postergacion: string | null; lat: number; lng: number }
