import { useEffect, useState } from 'react'
import { Megaphone } from 'lucide-react'
import { useData } from '@/context/DataContext.jsx'
import { useAuth } from '@/context/AuthContext.jsx'
import { useToast } from '@/components/ui/Toast.jsx'
import { Modal } from '@/components/ui/Modal.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Field, Input, Select } from '@/components/ui/Field.jsx'
import { CreativeLink } from '@/components/campaigns/CreativePlayer.jsx'
import { STATUS } from '@/lib/metrics.js'
import { cn } from '@/lib/cn.js'

const DEFAULT_CREATIVE_URL = '/creatives/setanta-2.mp4'

const emptyForm = {
  name: '',
  advertiserId: '',
  objective: 'awareness',
  status: 'received',
  budget: '',
  startDate: '',
  endDate: '',
  channelIds: [],
  creativeUrl: DEFAULT_CREATIVE_URL,
}

/** Принимаем и внешние ссылки, и файлы из /public. */
function isValidUrl(value) {
  if (!value) return false
  if (value.startsWith('/')) return true
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
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
        creativeUrl: initial.creativeUrl || DEFAULT_CREATIVE_URL,
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
    if (isAdmin && (!form.budget || Number(form.budget) <= 0)) {
      err.budget = 'Бюджет больше нуля'
    }
    if (!form.startDate) err.startDate = 'Укажите начало периода'
    if (!form.endDate) err.endDate = 'Укажите окончание периода'
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      err.endDate = 'Окончание должно быть позже начала'
    }
    if (form.creativeUrl.trim() && !isValidUrl(form.creativeUrl.trim())) {
      err.creativeUrl = 'Укажите ссылку на видео'
    }
    setErrors(err)
    if (Object.keys(err).length) return

    const payload = {
      name: form.name.trim(),
      advertiserId: form.advertiserId,
      objective: form.objective,
      status: isAdmin && editing ? form.status : initial?.status || 'received',
      // Бюджет проставляет админ — рекламодатель его не видит и не задаёт.
      budget: isAdmin ? Number(form.budget) : initial?.budget || 0,
      startDate: form.startDate,
      endDate: form.endDate,
      channelIds: form.channelIds,
      creativeUrl: form.creativeUrl.trim(),
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
          {isAdmin && editing && (
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
          )}

          {isAdmin && (
            <Field label="Бюджет" required error={errors.budget}>
              <Input
                type="number"
                min="0"
                value={form.budget}
                onChange={(e) => set('budget', e.target.value)}
                placeholder="1000000"
              />
            </Field>
          )}
        </div>

        <div>
          <p className="mb-2 text-[13px] font-medium text-ink-soft">
            Период кампании <span className="text-danger">*</span>
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Начало периода" required error={errors.startDate}>
              <Input
                type="date"
                value={form.startDate}
                max={form.endDate || undefined}
                onChange={(e) => set('startDate', e.target.value)}
              />
            </Field>
            <Field
              label="Окончание периода"
              required
              error={errors.endDate}
            >
              <Input
                type="date"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(e) => set('endDate', e.target.value)}
              />
            </Field>
          </div>
        </div>

        <Field
          label="Рекламный ролик"
          error={errors.creativeUrl}
          hint="Ссылка на видеофайл — можно заменить на другой ролик."
        >
          <div className="flex items-center gap-2">
            <Input
              inputMode="url"
              value={form.creativeUrl}
              onChange={(e) => set('creativeUrl', e.target.value)}
              placeholder={DEFAULT_CREATIVE_URL}
            />
            <CreativeLink
              url={
                isValidUrl(form.creativeUrl.trim())
                  ? form.creativeUrl.trim()
                  : ''
              }
            />
          </div>
        </Field>
      </div>
    </Modal>
  )
}
