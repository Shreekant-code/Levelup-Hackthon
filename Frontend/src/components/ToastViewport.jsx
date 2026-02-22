import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { useToast } from '../context/ToastContext'

const toastStyles = {
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  error: 'border-red-500/40 bg-red-500/10 text-red-200',
  info: 'border-blue-500/40 bg-blue-500/10 text-blue-200',
}

const toastIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const ToastViewport = () => {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed right-4 top-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = toastIcons[toast.type] || Info
        return (
          <div
            key={toast.id}
            className={`rounded-xl border px-4 py-3 shadow-xl backdrop-blur-xl transition-all duration-200 ${toastStyles[toast.type] || toastStyles.info}`}
          >
            <div className="flex items-start gap-3">
              <Icon size={18} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                {toast.title ? <p className="text-sm font-semibold">{toast.title}</p> : null}
                {toast.message ? <p className="text-xs opacity-90">{toast.message}</p> : null}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-xs opacity-70 hover:opacity-100"
              >
                close
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ToastViewport
