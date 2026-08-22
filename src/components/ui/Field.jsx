import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn.js'

const baseControl =
  'w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink placeholder:text-ink-muted transition-all focus-ring focus-visible:border-indigo-300 disabled:opacity-50'

export function Field({ label, hint, error, required, children, className }) {
  return (
    <label className={cn('block space-y-1.5', className)}>
      {label && (
        <span className="flex items-center gap-1 text-[13px] font-medium text-ink-soft">
          {label}
          {required && <span className="text-danger">*</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="block text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="block text-xs text-ink-muted">{hint}</span>
      ) : null}
    </label>
  )
}

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(baseControl, 'h-11', className)}
      {...props}
    />
  )
})

export const Textarea = forwardRef(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(baseControl, 'min-h-[92px] py-2.5 resize-y', className)}
      {...props}
    />
  )
})

export const Select = forwardRef(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          baseControl,
          'h-11 appearance-none pr-9 cursor-pointer',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
      />
    </div>
  )
})
