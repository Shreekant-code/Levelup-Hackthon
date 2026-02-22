import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback(
    ({ type = 'info', title = '', message = '', duration = 3500 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const toast = { id, type, title, message }
      setToasts((prev) => [toast, ...prev].slice(0, 5))
      window.setTimeout(() => removeToast(id), duration)
    },
    [removeToast]
  )

  const value = useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
    }),
    [toasts, addToast, removeToast]
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used inside ToastProvider')
  }
  return ctx
}
