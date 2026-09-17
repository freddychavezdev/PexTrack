import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Compass, LayoutList, LogOut, Map, Moon, PanelLeftClose, PanelLeftOpen, Play, Sun, X } from 'lucide-react'
import { DetailDrawer } from './components/DetailDrawer'
import { MapView } from './components/MapView'
import { OrdersTable } from './components/OrdersTable'
import { advanceCrew } from './lib/mock'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { loadDashboard, reportCrewPosition, subscribeDashboard, updateOrder } from './lib/repository'
import type { Crew, Profile, Role, WorkOrder } from './types'

async function fetchProfile(userId: string): Promise<Profile> {
  if (!supabase) throw new Error('Supabase no está configurado.')
  const { data, error } = await supabase.from('users').select('id,nombre_completo,email,roles(nombre)').eq('id', userId).single()
  if (error || !data) throw new Error('Tu cuenta no tiene un perfil PexTrack asociado. Contacta al administrador.')
  const row = data as unknown as { id: string; nombre_completo: string; email: string; roles: { nombre: Role } | null }
  if (!row.roles?.nombre) throw new Error('Tu perfil no tiene un rol asignado.')
  let cuadrillaId: string | undefined
  if (row.roles.nombre === 'tecnico') {
    const { data: crews, error: crewError } = await supabase.from('cuadrillas').select('id').or(`tecnico_1_id.eq.${userId},tecnico_2_id.eq.${userId}`).limit(1)
    if (crewError) throw new Error('No se pudo validar la cuadrilla asignada.')
    cuadrillaId = crews?.[0]?.id
  }
  return { id: row.id, email: row.email, nombre_completo: row.nombre_completo, role: row.roles.nombre, cuadrillaId }
}

function Login({ onLogin, startupError }: { onLogin: (profile: Profile) => void; startupError?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('coordinador')
  const [error, setError] = useState(startupError ?? '')
  const [loading, setLoading] = useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('')
    if (!isSupabaseConfigured) return onLogin({ id: 'demo', email: 'demo@pextrack.bo', nombre_completo: `Demo ${role}`, role, cuadrillaId: role === 'tecnico' ? 'crew-1' : undefined })
    setLoading(true)
    try {
      const { data, error: signInError } = await supabase!.auth.signInWithPassword({ email, password })
      if (signInError || !data.user) throw new Error('Correo o contraseña incorrectos.')
      onLogin(await fetchProfile(data.user.id))
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'No se pudo iniciar sesión.')
      await supabase?.auth.signOut()
    } finally { setLoading(false) }
  }
  return <main className="login-shell grid min-h-screen place-items-center p-5"><form onSubmit={submit} className="login-card w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 sm:p-8"><div className="mb-8 flex items-start gap-4"><span className="brand-mark"><Compass size={27} strokeWidth={2.4} /></span><div><p className="brand-name">PEXTRACK</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Control operativo</h1><p className="mt-2 max-w-[31ch] text-sm leading-6 text-slate-500">Consulta cuadrillas y órdenes de trabajo en un solo lugar.</p></div></div>{isSupabaseConfigured ? <><label className="form-label">Correo<input type="email" autoComplete="email" required disabled={loading} value={email} onChange={e => setEmail(e.target.value)} className="form-input" placeholder="nombre@empresa.com" /></label><label className="form-label">Contraseña<input type="password" autoComplete="current-password" required disabled={loading} value={password} onChange={e => setPassword(e.target.value)} className="form-input" placeholder="Tu contraseña" /></label></> : <label className="form-label">Perfil de demostración<select value={role} onChange={e => setRole(e.target.value as Role)} className="form-input"><option value="admin">Supervisor (Admin)</option><option value="coordinador">Coordinador</option><option value="tecnico">Técnico</option></select><span className="mt-2 block text-xs font-normal leading-5 text-slate-500">Modo simulación: configura Supabase para usar cuentas reales.</span></label>}{error && <p role="alert" className="mt-5 flex gap-2 rounded-xl bg-red-50 p-3 text-sm leading-5 text-red-700 dark:bg-red-950 dark:text-red-200"><AlertCircle className="mt-0.5 shrink-0" size={17} />{error}</p>}<button disabled={loading} className="primary-button mt-6 w-full">{loading ? 'Verificando acceso…' : 'Ingresar'}</button></form></main>
}

function dashboardErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const detail = error as { code?: unknown; message?: unknown }
    const code = detail.code ? ` (${String(detail.code)})` : ''
    return `No se pudieron cargar los datos${code}: ${String(detail.message)}`
  }
  return 'No se pudieron cargar los datos.'
}

function Dashboard({ profile, onLogout }: { profile: Profile; onLogout: () => void }) {
  const [dark, setDark] = useState(() => localStorage.theme === 'dark'); const [crews, setCrews] = useState<Crew[]>([]); const [orders, setOrders] = useState<WorkOrder[]>([]); const [selectedOrder, setSelectedOrder] = useState<WorkOrder>(); const [selectedCrew, setSelectedCrew] = useState<Crew>(); const [tab, setTab] = useState<'map' | 'table'>('map'); const [panelOpen, setPanelOpen] = useState(true); const [running, setRunning] = useState(false); const [message, setMessage] = useState('')
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.theme = dark ? 'dark' : 'light' }, [dark])
  useEffect(() => { const refresh = () => loadDashboard().then(data => { setCrews(data.crews); setOrders(data.orders) }).catch((error: unknown) => setMessage(dashboardErrorMessage(error))); refresh(); return subscribeDashboard(refresh) }, [])
  useEffect(() => { if (!running) return; let step = 0; const timer = window.setInterval(() => { step++; setCrews(current => { const next = current.map(crew => advanceCrew(crew, step)); if (isSupabaseConfigured) void Promise.all(next.map(crew => reportCrewPosition(crew))).catch(() => setMessage('No se pudo guardar la posición GPS.')); return next }) }, 5000); return () => clearInterval(timer) }, [running])
  const visible = useMemo(() => profile.role === 'tecnico' ? { crews: crews.filter(crew => crew.id === profile.cuadrillaId), orders: orders.filter(order => order.cuadrilla_id === profile.cuadrillaId) } : { crews, orders }, [crews, orders, profile]); const selectOrder = (order: WorkOrder) => { setSelectedOrder(order); setSelectedCrew(undefined); setTab('map') }; const save = async (patch: Parameters<typeof updateOrder>[1]) => { if (!selectedOrder) return; try { await updateOrder(selectedOrder.id, patch); setOrders(current => current.map(order => order.id === selectedOrder.id ? { ...order, ...patch } : order)); setSelectedOrder(order => order ? { ...order, ...patch } : order); setMessage('Orden actualizada.') } catch { setMessage('No se pudo guardar la actualización.') } }; const simulate = () => { setRunning(current => !current) }
  return <div className="app-shell h-screen overflow-hidden"><header className="app-header"><div className="app-identity"><span className="brand-mark"><Compass size={25} strokeWidth={2.4} /></span><div><p className="brand-name">PEXTRACK</p><h1>Panel operativo</h1></div></div><div className="header-actions"><button onClick={() => setPanelOpen(open => !open)} className="icon-button panel-toggle" title={panelOpen ? 'Ocultar órdenes de trabajo' : 'Mostrar órdenes de trabajo'} aria-label={panelOpen ? 'Ocultar órdenes de trabajo' : 'Mostrar órdenes de trabajo'}>{panelOpen ? <PanelLeftClose size={19} /> : <PanelLeftOpen size={19} />}</button><button onClick={simulate} className={`simulator-button ${running ? 'simulator-button--running' : ''}`}><Play size={16} fill="currentColor" /><span>{running ? 'Pausar simulador' : 'Simular GPS'}</span></button><button aria-label="Cambiar tema" onClick={() => setDark(!dark)} className="icon-button">{dark ? <Sun size={19} /> : <Moon size={19} />}</button><span className="user-summary"><b>{profile.nombre_completo}</b><span className="capitalize">{profile.role}</span></span><button aria-label="Cerrar sesión" title="Cerrar sesión" onClick={onLogout} className="icon-button"><LogOut size={19} /></button></div></header>{message && <div role="status" className="notification"><AlertCircle size={17} /><span>{message}</span><button aria-label="Cerrar aviso" onClick={() => setMessage('')}><X size={16} /></button></div>}<div className="dashboard-content md:flex"><section className={`orders-panel ${tab === 'table' ? 'block' : 'hidden md:block'} ${panelOpen ? 'orders-panel--open' : 'orders-panel--closed'}`}><div className="h-full min-w-[320px]"><OrdersTable orders={visible.orders} selectedId={selectedOrder?.id} onSelect={selectOrder} /></div></section><section className={`map-panel ${tab === 'map' ? 'block' : 'hidden md:block'}`}><MapView crews={visible.crews} orders={visible.orders} selectedOrder={selectedOrder} onCrew={crew => { setSelectedCrew(crew); setSelectedOrder(undefined) }} onOrder={selectOrder} /></section></div><nav className="mobile-tabs"><button onClick={() => setTab('map')} aria-current={tab === 'map' ? 'page' : undefined} className={tab === 'map' ? 'mobile-tab--active' : ''}><Map size={17} />Mapa</button><button onClick={() => setTab('table')} aria-current={tab === 'table' ? 'page' : undefined} className={tab === 'table' ? 'mobile-tab--active' : ''}><LayoutList size={17} />Órdenes</button></nav><DetailDrawer order={selectedOrder} crew={selectedCrew} crews={crews} role={profile.role} onClose={() => { setSelectedOrder(undefined); setSelectedCrew(undefined) }} onSave={save} /></div>
}

export default function App() {
  const [profile, setProfile] = useState<Profile>(); const [ready, setReady] = useState(!isSupabaseConfigured); const [startupError, setStartupError] = useState('')
  useEffect(() => { const client = supabase; if (!client) return; let active = true; const restore = (userId?: string) => { if (!userId) { if (active) setProfile(undefined); return }; void fetchProfile(userId).then(value => { if (active) setProfile(value) }).catch(async error => { if (active) { setProfile(undefined); setStartupError(error instanceof Error ? error.message : 'No se pudo restaurar la sesión.'); await client.auth.signOut() } }) }; void client.auth.getSession().then(({ data }) => { restore(data.session?.user.id); if (active) setReady(true) }); const { data: listener } = client.auth.onAuthStateChange((_event, session) => restore(session?.user.id)); return () => { active = false; listener.subscription.unsubscribe() } }, [])
  if (!ready) return <main className="grid min-h-screen place-items-center text-slate-500">Restaurando sesión…</main>
  return profile ? <Dashboard profile={profile} onLogout={() => { void supabase?.auth.signOut(); setProfile(undefined) }} /> : <Login onLogin={setProfile} startupError={startupError} />
}
