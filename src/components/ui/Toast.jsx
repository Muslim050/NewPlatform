import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/cn.js'

const ToastCtx = createContext(null)

const icons = {
  success: Check,
  error: AlertTriangle,
  info: Info,
}
const accents = {
  success: 'bg-success text-white',
  error: 'bg-danger text-white',
  info: 'bg-indigo-600 text-white',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const push = useCallback(
    (type, message) => {
      const id = ++idRef.current
      setToasts((t) => [...t, { id, type, message }])
      setTimeout(() => dismiss(id), 3600)
    },
    [dismiss],
  )

  const api = {
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  }

  return (
    <ToastCtx.Provider value={api}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[340px] max-w-[calc(100vw-2.5rem)] flex-col gap-2.5">
          <AnimatePresence>
            {toasts.map((t) => {
              const Icon = icons[t.type]
              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 40, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-line bg-surface/95 p-3 pr-3.5 shadow-lift backdrop-blur"
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
                      accents[t.type],
                    )}
                  >
                    <Icon size={16} strokeWidth={2.5} />
                  </span>
                  <p className="flex-1 text-[13px] font-medium text-ink">
                    {t.message}
                  </p>
                  <button
                    onClick={() => dismiss(t.id)}
                    className="text-ink-muted transition-colors hover:text-ink"
                  >
                    <X size={15} />
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast должен вызываться внутри <ToastProvider>')
  return ctx
}
