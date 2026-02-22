import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { Flame, LogOut, Sparkles, Star } from 'lucide-react'

const Sidebar = ({ open, setOpen, navItems, userName, xp, level, streak, onLogout }) => {
  const sidebarRef = useRef(null)

  useEffect(() => {
    const onMouseDown = (event) => {
      if (!open) return
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open, setOpen])

  const xpProgress = Math.max(0, Math.min(100, ((xp % 200) / 200) * 100))

  return (
    <>
      {open ? <div className="fixed inset-0 z-40 bg-black/45 md:hidden" /> : null}
      <aside
        ref={sidebarRef}
        className={`fixed left-0 top-0 z-50 h-full w-72 p-4 transition-transform duration-300 ease-out md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/80 backdrop-blur-xl shadow-[0_0_45px_rgba(59,130,246,0.14)]">
          <div className="border-b border-white/10 p-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">FutureME</p>
            <h2 className="mt-1 truncate text-lg font-semibold">{userName || 'Student'}</h2>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-neutral-200">
                <Star size={12} /> Level {level}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-neutral-200">
                <Flame size={12} className="text-orange-300" /> {streak}
              </span>
            </div>
            <div className="mt-3 rounded-full bg-white/10 p-1">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 transition-all"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-neutral-400">{xp} XP</p>
          </div>

          <nav className="space-y-1 p-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all ${
                    isActive
                      ? 'border border-white/20 bg-gradient-to-r from-purple-500/25 to-blue-500/25 text-white shadow-[0_0_16px_rgba(99,102,241,0.25)]'
                      : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <item.icon size={16} className="transition-transform duration-200 group-hover:scale-110" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto border-t border-white/10 p-3">
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm text-red-200 transition-colors hover:bg-red-500/20"
            >
              <LogOut size={14} /> Logout
            </button>
            <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-neutral-500">
              <Sparkles size={11} /> Adaptive AI Productivity
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
