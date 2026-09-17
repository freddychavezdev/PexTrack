import { useEffect, useMemo, useState } from 'react'
import { LogOut, Moon, PanelLeftClose, PanelLeftOpen, Play, Sun } from 'lucide-react'
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
  return <main className="grid min-h-screen place-items-center p-5"><form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-xl dark:bg-slate-900"><div className="mb-7"><p className="font-semibold text-blue-600">PEXTRACK</p><h1 className="mt-1 text-2xl font-bold">Control operativo</h1><p className="mt-2 text-sm text-slate-500">Ingresa para ver el estado de las cuadrillas.</p></div>{isSupabaseConfigured ? <><label className="mb-4 block text-sm font-medium">Correo<input type="email" autoComplete="email" required disabled={loading} value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-transparent p-2.5 disabled:opacity-60 dark:border-slate-600" /></label><label className="mb-4 block text-sm font-medium">Contraseña<input type="password" autoComplete="current-password" required disabled={loading} value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-transparent p-2.5 disabled:opacity-60 dark:border-slate-600" /></label></> : <label className="mb-4 block text-sm font-medium">Perfil de demostración<select value={role} onChange={e => setRole(e.target.value as Role)} className="mt-1 w-full rounded-lg border border-slate-300 bg-transparent p-2.5 dark:border-slate-600"><option value="admin">Supervisor (Admin)</option><option value="coordinador">Coordinador</option><option value="tecnico">Técnico</option></select><span className="mt-2 block text-xs font-normal text-slate-500">Modo simulación: configura Supabase para usar cuentas reales.</span></label>}{error && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p>}<button disabled={loading} className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70">{loading ? 'Verificando acceso…' : 'Ingresar'}</button></form></main>
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
  return <div className="h-screen overflow-hidden"><header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900"><div><p className="text-xs font-bold tracking-widest text-blue-600">PEXTRACK</p><h1 className="font-semibold">Panel operativo</h1></div><div className="flex items-center gap-2"><button onClick={() => setPanelOpen(open => !open)} className="hidden items-center gap-1 rounded px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 md:flex" title={panelOpen ? 'Ocultar órdenes de trabajo' : 'Mostrar órdenes de trabajo'}>{panelOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}<span>{panelOpen ? 'Ocultar tablero' : 'Mostrar tablero'}</span></button><button onClick={simulate} className={`hidden items-center gap-1 rounded px-3 py-2 text-sm font-medium sm:flex ${running ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}><Play size={16} />{running ? 'Pausar simulador' : 'Simular GPS'}</button><button aria-label="Cambiar tema" onClick={() => setDark(!dark)} className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800">{dark ? <Sun size={19} /> : <Moon size={19} />}</button><span className="hidden text-right text-sm sm:block"><b>{profile.nombre_completo}</b><br /><span className="capitalize text-slate-500">{profile.role}</span></span><button aria-label="Cerrar sesión" onClick={onLogout} className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><LogOut size={19} /></button></div></header>{message && <div className="absolute z-40 right-3 top-20 rounded bg-slate-800 px-3 py-2 text-sm text-white">{message}</div>}<div className="h-[calc(100vh-4rem)] md:flex"><section className={`h-full shrink-0 overflow-hidden bg-white transition-[width,opacity] duration-300 ease-in-out dark:bg-slate-900 ${tab === 'table' ? 'block' : 'hidden md:block'} ${panelOpen ? 'md:w-[35%] md:opacity-100' : 'pointer-events-none md:w-0 md:opacity-0'}`}><div className="h-full min-w-[320px]"><OrdersTable orders={visible.orders} selectedId={selectedOrder?.id} onSelect={selectOrder} /></div></section><section className={`h-full min-w-0 flex-1 ${tab === 'map' ? 'block' : 'hidden md:block'}`}><MapView crews={visible.crews} orders={visible.orders} selectedOrder={selectedOrder} onCrew={crew => { setSelectedCrew(crew); setSelectedOrder(undefined) }} onOrder={selectOrder} /></section></div><nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900 md:hidden"><button onClick={() => setTab('map')} className={`flex-1 rounded py-2 text-sm font-medium ${tab === 'map' ? 'bg-blue-600 text-white' : ''}`}>Mapa</button><button onClick={() => setTab('table')} className={`flex-1 rounded py-2 text-sm font-medium ${tab === 'table' ? 'bg-blue-600 text-white' : ''}`}>Tabla</button></nav><DetailDrawer order={selectedOrder} crew={selectedCrew} crews={crews} role={profile.role} onClose={() => { setSelectedOrder(undefined); setSelectedCrew(undefined) }} onSave={save} /></div>
}

export default function App() {
  const [profile, setProfile] = useState<Profile>(); const [ready, setReady] = useState(!isSupabaseConfigured); const [startupError, setStartupError] = useState('')
  useEffect(() => { const client = supabase; if (!client) return; let active = true; const restore = (userId?: string) => { if (!userId) { if (active) setProfile(undefined); return }; void fetchProfile(userId).then(value => { if (active) setProfile(value) }).catch(async error => { if (active) { setProfile(undefined); setStartupError(error instanceof Error ? error.message : 'No se pudo restaurar la sesión.'); await client.auth.signOut() } }) }; void client.auth.getSession().then(({ data }) => { restore(data.session?.user.id); if (active) setReady(true) }); const { data: listener } = client.auth.onAuthStateChange((_event, session) => restore(session?.user.id)); return () => { active = false; listener.subscription.unsubscribe() } }, [])
  if (!ready) return <main className="grid min-h-screen place-items-center text-slate-500">Restaurando sesión…</main>
  return profile ? <Dashboard profile={profile} onLogout={() => { void supabase?.auth.signOut(); setProfile(undefined) }} /> : <Login onLogin={setProfile} startupError={startupError} />
}
