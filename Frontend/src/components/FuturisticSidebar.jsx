import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { Bell, Flame, LogOut, Star } from 'lucide-react'

const FuturisticSidebar = ({
  open,
  setOpen,
  navItems,
  userName,
  level,
  xp,
  xpProgress,
  streak,
  onLogout,
}) => {
  const panelRef = useRef(null)

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!open) return
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open, setOpen])

  return (
    <>
      {open ? <div className="fixed inset-0 z-40 bg-black/40 md:hidden" /> : null}
      <aside
        ref={panelRef}
        className={`fixed z-50 top-0 left-0 h-full w-72 p-4 transition-transform duration-300 md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full rounded-3xl border border-white/10 bg-neutral-900/80 backdrop-blur-xl shadow-[0_0_30px_rgba(59,130,246,0.1)] flex flex-col">
          <div className="p-4 border-b border-white/10">
            <p className="text-xs uppercase tracking-wider text-neutral-400">Welcome Back</p>
            <h3 className="mt-1 text-lg font-semibold truncate">{userName || 'FutureME User'}</h3>
            <div className="mt-3 flex items-center justify-between text-xs text-neutral-300">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1">
                <Star size={12} /> Level {level}
              </span>
              <span>{xp.toFixed(0)} XP</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <div className="mt-2 inline-flex items-center gap-1 text-xs text-orange-300">
              <Flame size={12} /> {streak} day streak
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all ${
                    isActive
                      ? 'border border-white/20 bg-gradient-to-r from-purple-500/30 to-blue-500/30 text-white'
                      : 'text-neutral-300 hover:bg-white/5 hover:shadow-[0_0_14px_rgba(59,130,246,0.15)]'
                  }`
                }
              >
                <item.icon size={16} className="transition-transform group-hover:scale-110" />
                {item.label}
              </NavLink>
            ))}
            <NavLink
              to="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all text-neutral-300 hover:bg-white/5"
            >
              <Bell size={16} className="transition-transform group-hover:scale-110" />
              Notifications
            </NavLink>
          </nav>

          <div className="p-3 border-t border-white/10">
            <button
              onClick={onLogout}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200 hover:bg-red-500/20"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default FuturisticSidebar
