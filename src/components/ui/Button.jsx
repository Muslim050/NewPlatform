import { forwardRef } from 'react'
import { cn } from '@/lib/cn.js'

const variants = {
  primary:
    'bg-indigo-500 text-ink shadow-soft hover:bg-indigo-400 hover:shadow-pop active:scale-[0.98]',
  lime: 'bg-lime-300 text-ink shadow-soft hover:bg-lime-400 hover:shadow-[0_16px_40px_rgba(255,209,6,0.42)] active:scale-[0.98]',
  secondary:
    'bg-surface text-ink border border-line hover:border-ink/25 hover:bg-white active:scale-[0.98]',
  ghost: 'text-ink-soft hover:text-ink hover:bg-ink/[0.05]',
  danger:
    'bg-danger/10 text-danger hover:bg-danger hover:text-white active:scale-[0.98]',
  dark: 'bg-ink text-white hover:bg-ink/90 shadow-soft active:scale-[0.98]',
}

const sizes = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl',
  icon: 'h-10 w-10 rounded-xl',
}

export const Button = forwardRef(function Button(
  { className, variant = 'primary', size = 'md', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200 focus-ring disabled:opacity-40 disabled:pointer-events-none select-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
})
