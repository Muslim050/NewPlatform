import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card.jsx'
import { Sparkline } from '@/components/charts/Sparkline.jsx'
import { cn } from '@/lib/cn.js'

export function StatCard({
  label,
  value,
  delta,
  deltaTone = 'success',
  spark,
  sparkColor = '#FFD106',
  icon: Icon,
  index = 0,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.06,
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Card hover className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-ink-muted">
            {Icon && <Icon size={16} strokeWidth={2} />}
            <span className="text-[13px] font-medium">{label}</span>
          </div>
          {delta != null && (
            <span
              className={cn(
                'tnum rounded-full px-2 py-0.5 text-[11px] font-semibold',
                deltaTone === 'success'
                  ? 'bg-success/10 text-success'
                  : 'bg-danger/10 text-danger',
              )}
            >
              {delta}
            </span>
          )}
        </div>
        <div className="mt-4 flex items-end justify-between gap-2">
          <span className="whitespace-nowrap font-display text-[22px] font-semibold leading-none text-ink tnum sm:text-[25px]">
            {value}
          </span>
          {spark && (
            <div className="mb-0.5 hidden shrink-0 sm:block">
              <Sparkline
                data={spark}
                color={sparkColor}
                width={72}
                height={36}
              />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
