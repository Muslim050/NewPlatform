import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Pencil, Plus, Trash2, Building2, Mail } from 'lucide-react'
import { useAuth } from '@/context/AuthContext.jsx'
import { useData } from '@/context/DataContext.jsx'
import { useToast } from '@/components/ui/Toast.jsx'
import { useConfirm } from '@/components/ui/Confirm.jsx'
import { ADV_STATUS } from '@/lib/metrics.js'
import { Card } from '@/components/ui/Card.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Badge } from '@/components/ui/Badge.jsx'
import { Avatar } from '@/components/ui/Avatar.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { DropdownMenu } from '@/components/ui/DropdownMenu.jsx'
import { AdvertiserForm } from '@/components/forms/AdvertiserForm.jsx'

export default function Advertisers() {
  const { canEdit } = useAuth()
  const { advertisers, campaigns, remove } = useData()
  const toast = useToast()
  const confirm = useConfirm()
  const [q, setQ] = useState('')
  const [modal, setModal] = useState({ open: false, initial: null })

  const filtered = advertisers.filter((a) =>
    `${a.name} ${a.contact} ${a.category}`
      .toLowerCase()
      .includes(q.trim().toLowerCase()),
  )

  const campaignCount = (id) =>
    campaigns.filter((c) => c.advertiserId === id).length

  const del = async (a) => {
    const count = campaignCount(a.id)
    const ok = await confirm({
      title: 'Удалить рекламодателя?',
      description: a.name,
      body: count
        ? `У рекламодателя ${count} кампаний. Они останутся, но без привязки к бренду.`
        : 'Действие нельзя отменить.',
    })
    if (ok) {
      remove('advertisers', a.id)
      toast.info('Рекламодатель удалён')
    }
  }

  return (
    <div>
      {/* Поиск и создание бренда — одной строкой */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Поиск бренда"
            placeholder="Поиск бренда…"
            className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-3.5 text-sm text-ink placeholder:text-ink-muted focus-ring focus-visible:border-indigo-300"
          />
        </div>
        {canEdit && (
          <Button
            variant="primary"
            className="shrink-0"
            onClick={() => setModal({ open: true, initial: null })}
          >
            <Plus size={18} />
            Новый рекламодатель
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building2}
            title="Рекламодателей нет"
            description="Список рекламодателей пока пуст."
            action={
              canEdit ? (
                <Button
                  variant="secondary"
                  onClick={() => setModal({ open: true, initial: null })}
                >
                  <Plus size={16} />
                  Добавить
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a, i) => {
            const st = ADV_STATUS[a.status]
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.35 }}
              >
                <Card hover className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex min-w-0 gap-3">
                      <Avatar
                        name={a.name}
                        color={a.color}
                        src={a.logo}
                        size="lg"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-display text-[15px] font-semibold text-ink">
                          {a.name}
                        </p>
                        <p className="truncate text-[12px] text-ink-muted">
                          {a.legalName || a.category}
                        </p>
                      </div>
                    </div>
                    {canEdit && (
                      <DropdownMenu
                        items={[
                          {
                            label: 'Изменить',
                            icon: Pencil,
                            onClick: () => setModal({ open: true, initial: a }),
                          },
                          {
                            label: 'Удалить',
                            icon: Trash2,
                            tone: 'danger',
                            onClick: () => del(a),
                          },
                        ]}
                      />
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Badge tone={st.tone} dot>
                      {st.label}
                    </Badge>
                    <span className="flex min-w-0 items-center gap-1 text-[12px] text-ink-muted">
                      <Mail size={12} />
                      <span className="truncate">{a.email}</span>
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4">
                    <Metric
                      label="Договоров"
                      value={a.contracts?.length ?? 0}
                    />
                    <Metric label="Кампаний" value={campaignCount(a.id)} />
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      <AdvertiserForm
        open={modal.open}
        initial={modal.initial}
        onClose={() => setModal({ open: false, initial: null })}
      />
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-[11px] text-ink-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-ink tnum">{value}</p>
    </div>
  )
}
