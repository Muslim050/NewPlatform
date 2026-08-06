import { useEffect, useState } from 'react'
import { Megaphone } from 'lucide-react'
import { useData } from '@/context/DataContext.jsx'
import { useAuth } from '@/context/AuthContext.jsx'
import { useToast } from '@/components/ui/Toast.jsx'
import { Modal } from '@/components/ui/Modal.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Field, Input, Select } from '@/components/ui/Field.jsx'
import { OBJECTIVES, STATUS } from '@/lib/metrics.js'
import { cn } from '@/lib/cn.js'

const emptyForm = {
  name: '',
  advertiserId: '',
  objective: 'awareness',
  status: 'draft',
  budget: '',
  startDate: '',
  endDate: '',
  channelIds: [],
}

export function CampaignForm({ open, onClose, initial }) {
  const { advertisers, channels, create, update } = useData()
  const { user, isAdmin } = useAuth()
  const toast = useToast()
  const editing = !!initial
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        name: initial.name,
        advertiserId: initial.advertiserId,
        objective: initial.objective,
        status: initial.status,
        budget: String(initial.budget),
        startDate: initial.startDate,
        endDate: initial.endDate,
        channelIds: [...initial.channelIds],
      })
    } else {
      setForm({
        ...emptyForm,
        advertiserId: isAdmin ? '' : user.advertiserId,
      })
    }
    setErrors({})
  }, [open, initial, isAdmin, user])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const toggleChannel = (id) =>
    setForm((f) => ({
      ...f,
      channelIds: f.channelIds.includes(id)
        ? f.channelIds.filter((x) => x !== id)
        : [...f.channelIds, id],
    }))

  const submit = () => {
    const err = {}
    if (!form.name.trim()) err.name = 'Укажите название'
    if (isAdmin && !form.advertiserId) err.advertiserId = 'Выберите рекламодателя'
    if (!form.budget || Number(form.budget) <= 0) err.budget = 'Бюджет больше нуля'
    setErrors(err)
    if (Object.keys(err).length) return

    const payload = {
      name: form.name.trim(),
      advertiserId: form.advertiserId,
      objective: form.objective,
      status: form.status,
      budget: Number(form.budget),
      startDate: form.startDate,
      endDate: form.endDate,
      channelIds: form.channelIds,
    }

    if (editing) {
      update('campaigns', initial.id, payload)
      toast.success('Кампания обновлена')
    } else {
      create('campaigns', {
        ...payload,
        spent: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
      })
      toast.success('Кампания создана')
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={Megaphone}
      title={editing ? 'Редактировать кампанию' : 'Новая кампания'}
      description={
        editing
          ? 'Обновите параметры кампании.'
          : 'Заполните параметры запуска. Метрики появятся после старта.'
      }
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button variant="primary" onClick={submit}>
            {editing ? 'Сохранить' : 'Создать кампанию'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Название" required error={errors.name}>
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Например, Летняя распродажа"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          {isAdmin && (
            <Field label="Рекламодатель" required error={errors.advertiserId}>
              <Select
                value={form.advertiserId}
                onChange={(e) => set('advertiserId', e.target.value)}
              >
                <option value="">— выберите —</option>
                {advertisers.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label="Цель">
            <Select
              value={form.objective}
              onChange={(e) => set('objective', e.target.value)}
            >
              {Object.entries(OBJECTIVES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Статус">
            <Select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
            >
              {Object.entries(STATUS)
                .filter(([k]) => k !== 'archived')
                .map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
            </Select>
          </Field>

          <Field label="Бюджет" required error={errors.budget}>
            <Input
              type="number"
              min="0"
              value={form.budget}
              onChange={(e) => set('budget', e.target.value)}
              placeholder="1000000"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Дата начала">
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
            />
          </Field>
          <Field label="Дата окончания">
            <Input
              type="date"
              value={form.endDate}
              onChange={(e) => set('endDate', e.target.value)}
            />
          </Field>
        </div>

        <Field label="Площадки" hint="Выберите одну или несколько площадок">
          <div className="flex flex-wrap gap-2 pt-1">
            {channels
              .filter((c) => c.status === 'active')
              .map((c) => {
                const on = form.channelIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleChannel(c.id)}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px] font-medium transition-all',
                      on
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-900'
                        : 'border-line bg-surface text-ink-soft hover:border-ink/20',
                    )}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: c.color }}
                    />
                    {c.name}
                  </button>
                )
              })}
          </div>
        </Field>
      </div>
    </Modal>
  )
}
