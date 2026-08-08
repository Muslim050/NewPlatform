import { useEffect, useRef, useState } from 'react'
import { ExternalLink, FileText, Megaphone, Paperclip, X } from 'lucide-react'
import { useData } from '@/context/DataContext.jsx'
import { useAuth } from '@/context/AuthContext.jsx'
import { useToast } from '@/components/ui/Toast.jsx'
import { Modal } from '@/components/ui/Modal.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Field, Input, Select } from '@/components/ui/Field.jsx'
import { CreativeLink } from '@/components/campaigns/CreativePlayer.jsx'
import { LEAGUES, PACKAGES, STATUS } from '@/lib/metrics.js'
import { cn } from '@/lib/cn.js'

const DEFAULT_CREATIVE_URL = '/creatives/setanta-2.mp4'
// Договор храним прямо в базе (localStorage), поэтому ограничиваем размер.
const MAX_CONTRACT_SIZE = 2 * 1024 * 1024

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
  contractNumber: '',
  package: '',
  leagues: [],
  legalName: '',
  contractStart: '',
  contractEnd: '',
  paymentTerms: '',
  contractFile: null,
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
        contractNumber: initial.contractNumber || '',
        package: initial.package || '',
        leagues: [...(initial.leagues || [])],
        legalName: initial.legalName || '',
        contractStart: initial.contractStart || '',
        contractEnd: initial.contractEnd || '',
        paymentTerms: initial.paymentTerms || '',
        contractFile: initial.contractFile || null,
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

  const toggleLeague = (id) =>
    setForm((f) => ({
      ...f,
      leagues: f.leagues.includes(id)
        ? f.leagues.filter((x) => x !== id)
        : [...f.leagues, id],
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
    if (
      isAdmin &&
      form.contractStart &&
      form.contractEnd &&
      form.contractEnd < form.contractStart
    ) {
      err.contractEnd = 'Окончание должно быть позже начала'
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
      contractNumber: form.contractNumber.trim(),
      // Условия договора заполняет только админ — у рекламодателя оставляем как есть.
      ...(isAdmin
        ? {
            package: form.package,
            leagues: form.leagues,
            legalName: form.legalName.trim(),
            contractStart: form.contractStart,
            contractEnd: form.contractEnd,
            paymentTerms: form.paymentTerms.trim(),
            contractFile: form.contractFile,
          }
        : null),
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

        {/* Рекламодатель указывает только номер договора. */}
        {!isAdmin && (
          <Field label="Номер договора">
            <Input
              value={form.contractNumber}
              onChange={(e) => set('contractNumber', e.target.value)}
              placeholder="Например, Д-2026/114"
            />
          </Field>
        )}

        {/* Условия договора — целиком на стороне админа. */}
        {isAdmin && (
          <div className="space-y-4 rounded-2xl border border-line bg-paper/55 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Договор
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Пакет">
                <Select
                  value={form.package}
                  onChange={(e) => set('package', e.target.value)}
                >
                  <option value="">— не выбран —</option>
                  {Object.entries(PACKAGES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Номер договора">
                <Input
                  value={form.contractNumber}
                  onChange={(e) => set('contractNumber', e.target.value)}
                  placeholder="Например, Д-2026/114"
                />
              </Field>
            </div>

            <Field label="Наименование юр. лица">
              <Input
                value={form.legalName}
                onChange={(e) => set('legalName', e.target.value)}
                placeholder='ООО «Пример»'
              />
            </Field>

            <div>
              <p className="mb-2 text-[13px] font-medium text-ink-soft">Лиги</p>
              <div className="flex flex-wrap gap-2">
                {LEAGUES.map((l) => {
                  const on = form.leagues.includes(l.id)
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => toggleLeague(l.id)}
                      aria-pressed={on}
                      className={cn(
                        'rounded-xl border px-3 py-1.5 text-[13px] font-medium transition-colors focus-ring',
                        on
                          ? 'border-indigo-300 bg-indigo-50 text-indigo-900'
                          : 'border-line bg-surface text-ink-soft hover:bg-ink/[0.03]',
                      )}
                    >
                      {l.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[13px] font-medium text-ink-soft">
                Срок договора
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Начало">
                  <Input
                    type="date"
                    value={form.contractStart}
                    max={form.contractEnd || undefined}
                    onChange={(e) => set('contractStart', e.target.value)}
                  />
                </Field>
                <Field label="Окончание" error={errors.contractEnd}>
                  <Input
                    type="date"
                    value={form.contractEnd}
                    min={form.contractStart || undefined}
                    onChange={(e) => set('contractEnd', e.target.value)}
                  />
                </Field>
              </div>
            </div>

            <Field
              label="Сроки оплаты"
              hint="Например: 50% предоплата до 01.09, остаток до 30.09."
            >
              <Input
                value={form.paymentTerms}
                onChange={(e) => set('paymentTerms', e.target.value)}
                placeholder="Опишите порядок и сроки оплаты"
              />
            </Field>

            <ContractFile
              file={form.contractFile}
              onChange={(v) => set('contractFile', v)}
            />
          </div>
        )}
      </div>
    </Modal>
  )
}

/** Загрузка скана договора — файл кладём в базу как data-URL. */
function ContractFile({ file, onChange }) {
  const inputRef = useRef(null)
  const toast = useToast()

  const pick = (e) => {
    const picked = e.target.files?.[0]
    // Сбрасываем input, иначе повторный выбор того же файла не сработает.
    e.target.value = ''
    if (!picked) return
    if (picked.size > MAX_CONTRACT_SIZE) {
      toast.error('Файл больше 2 МБ — загрузите версию поменьше')
      return
    }
    const reader = new FileReader()
    reader.onload = () =>
      onChange({ name: picked.name, url: String(reader.result) })
    reader.onerror = () => toast.error('Не удалось прочитать файл')
    reader.readAsDataURL(picked)
  }

  return (
    <div>
      <p className="mb-2 text-[13px] font-medium text-ink-soft">Файл договора</p>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,image/*"
        onChange={pick}
        className="hidden"
      />
      {file ? (
        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2">
          <FileText size={16} className="shrink-0 text-indigo-800" />
          <a
            href={file.url}
            download={file.name}
            className="flex min-w-0 items-center gap-1.5 truncate text-[13px] font-medium text-ink underline-offset-2 hover:text-indigo-800 hover:underline focus-ring"
            title={file.name}
          >
            <span className="truncate">{file.name}</span>
            <ExternalLink size={13} className="shrink-0 text-ink-muted" />
          </a>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
            >
              Заменить
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-9 w-9 px-0"
              onClick={() => onChange(null)}
              title="Удалить файл"
              aria-label="Удалить файл договора"
            >
              <X size={16} />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line px-3 py-3 text-[13px] font-medium text-ink-soft transition-colors hover:border-indigo-300 hover:bg-indigo-50 focus-ring"
        >
          <Paperclip size={16} className="text-ink-muted" />
          Загрузить договор
        </button>
      )}
      <p className="mt-1.5 text-xs text-ink-muted">
        PDF, DOC или скан, до 2 МБ.
      </p>
    </div>
  )
}
