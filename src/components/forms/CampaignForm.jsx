import { useEffect, useRef, useState } from 'react'
import {
  Download,
  ExternalLink,
  FileText,
  Film,
  Paperclip,
  X,
} from 'lucide-react'
import { useData } from '@/context/DataContext.jsx'
import { useAuth } from '@/context/AuthContext.jsx'
import { useToast } from '@/components/ui/Toast.jsx'
import { Modal } from '@/components/ui/Modal.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Field, Input, Select } from '@/components/ui/Field.jsx'
import { MultiSelect } from '@/components/ui/MultiSelect.jsx'
import { CreativeLink } from '@/components/campaigns/CreativePlayer.jsx'
import { Logo } from '@/components/Logo.jsx'
import { LEAGUES, PACKAGES, STATUS, statusLabel } from '@/lib/metrics.js'
import { cn } from '@/lib/cn.js'

// Договор храним прямо в базе (localStorage), поэтому ограничиваем размер.
const MAX_CONTRACT_SIZE = 2 * 1024 * 1024
// По умолчанию оплату ставим на конец августа текущего года.
const defaultPaymentDate = () => `${new Date().getFullYear()}-08-31`

const emptyForm = {
  name: '',
  advertiserId: '',
  objective: 'awareness',
  status: 'sent',
  startDate: '',
  endDate: '',
  channelIds: [],
  // Ролик приходит из выбранной рекламной кампании — дефолта нет.
  creativeUrl: '',
  creativeName: '',
  contractNumber: '',
  package: '',
  leagues: [],
  legalName: '',
  contractStart: '',
  contractEnd: '',
  paymentDate: defaultPaymentDate(),
  contractFile: null,
}

/** Принимаем файлы из /public, внешние ссылки и выбранные с компьютера файлы. */
function isValidUrl(value) {
  if (!value) return false
  if (value.startsWith('/')) return true
  if (value.startsWith('data:') || value.startsWith('blob:')) return true
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/** Имя файла из пути — для роликов, залитых в /public. */
function fileNameFromUrl(url) {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return ''
  return url.split('/').pop() || ''
}

export function CampaignForm({ open, onClose, initial }) {
  const { advertisers, channels, create, update } = useData()
  const { user, isAdmin } = useAuth()
  const toast = useToast()
  const editing = !!initial
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  const advertiserOf = (advertiserId) =>
    advertisers.find((a) => a.id === advertiserId)
  const legalNameOf = (advertiserId) => advertiserOf(advertiserId)?.legalName || ''
  // Договоры бренда — из них выбирается номер и подтягиваются условия.
  const contracts = advertiserOf(form.advertiserId)?.contracts ?? []
  const selectedContract = contracts.find(
    (c) => c.number === form.contractNumber,
  )

  /** Выбрали договор — переносим его условия в кампанию. */
  const applyContract = (number) => {
    const contract = contracts.find((c) => c.number === number)
    setForm((f) => ({
      ...f,
      contractNumber: number,
      // Кампанию из договора не подставляем — её выбирают вручную.
      ...(contract
        ? {
            package: contract.package || '',
            leagues: [...(contract.leagues ?? [])],
            legalName: contract.legalName || f.legalName,
            contractStart: contract.start || '',
            contractEnd: contract.end || '',
            paymentDate: contract.paymentDate || f.paymentDate,
            contractFile: contract.file || f.contractFile,
          }
        : null),
    }))
  }

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        name: initial.name,
        advertiserId: initial.advertiserId,
        objective: initial.objective,
        status: initial.status,
        startDate: initial.startDate,
        endDate: initial.endDate,
        channelIds: [...initial.channelIds],
        creativeUrl: initial.creativeUrl || '',
        creativeName: initial.creativeName || '',
        contractNumber: initial.contractNumber || '',
        package: initial.package || '',
        leagues: [...(initial.leagues || [])],
        // Если у кампании юр. лицо не заполнено — берём из карточки бренда.
        legalName: initial.legalName || legalNameOf(initial.advertiserId),
        contractStart: initial.contractStart || '',
        contractEnd: initial.contractEnd || '',
        paymentDate: initial.paymentDate || defaultPaymentDate(),
        contractFile: initial.contractFile || null,
      })
    } else {
      const advertiserId = isAdmin ? '' : user.advertiserId
      setForm({
        ...emptyForm,
        advertiserId,
        legalName: legalNameOf(advertiserId),
      })
    }
    setErrors({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial, isAdmin, user])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  /** Выбрали рекламную кампанию — вместе с ней подтягивается её ролик. */
  const selectCampaign = (name) => {
    const creative =
      name && name === selectedContract?.campaignName
        ? selectedContract.creative
        : null
    setForm((f) => ({
      ...f,
      name,
      ...(creative
        ? { creativeUrl: creative.url, creativeName: creative.name }
        : null),
    }))
  }

  // Смена бренда подтягивает его юр. лицо, но не затирает правку руками.
  const setAdvertiser = (advertiserId) =>
    setForm((f) => ({
      ...f,
      advertiserId,
      legalName:
        !f.legalName || f.legalName === legalNameOf(f.advertiserId)
          ? legalNameOf(advertiserId)
          : f.legalName,
    }))

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
    if (!form.startDate) err.startDate = 'Укажите начало периода'
    if (!form.endDate) err.endDate = 'Укажите окончание периода'
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      err.endDate = 'Окончание должно быть позже начала'
    }
    if (form.creativeUrl.trim() && !isValidUrl(form.creativeUrl.trim())) {
      err.creativeUrl = 'Укажите ссылку на видео'
    }
    if (
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
      status: isAdmin && editing ? form.status : initial?.status || 'sent',
      // Бюджет правится инлайн в таблице кампаний, форма его не трогает.
      budget: initial?.budget || 0,
      startDate: form.startDate,
      endDate: form.endDate,
      channelIds: form.channelIds,
      creativeUrl: form.creativeUrl.trim(),
      creativeName: form.creativeName,
      // Условия договора — и при создании, и при редактировании.
      contractNumber: form.contractNumber.trim(),
      package: form.package,
      leagues: form.leagues,
      legalName: form.legalName.trim(),
      contractStart: form.contractStart,
      contractEnd: form.contractEnd,
      paymentDate: form.paymentDate.trim(),
      contractFile: form.contractFile,
    }

    if (editing) {
      update('campaigns', initial.id, payload)
      // Смена статуса — событие само по себе, о нём говорим отдельно.
      if (payload.status !== initial.status) {
        toast.success(
          `«${payload.name}»: ${statusLabel(initial.status)} → ${statusLabel(
            payload.status,
          )}`,
        )
      } else {
        toast.success('Кампания обновлена')
      }
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
      logo={<Logo size={40} withWord={false} />}
      title={editing ? 'Редактировать кампанию' : 'Новая кампания'}
      description={
        editing
          ? 'Обновите параметры кампании.'
          : 'Заполните параметры запуска кампаний.'
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
        {/* Период кампании идёт первым — с него начинают заполнять форму. */}
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
            <Field label="Окончание периода" required error={errors.endDate}>
              <Input
                type="date"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(e) => set('endDate', e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* Сначала договор, затем рекламная кампания из него: с ней в форму
            приходят ролик, пакет, лиги и срок. */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Номер договора"
            hint={
              contracts.length
                ? undefined
                : 'У бренда нет договоров — добавьте их в карточке рекламодателя.'
            }
          >
            {contracts.length ? (
              <Select
                value={form.contractNumber}
                onChange={(e) => applyContract(e.target.value)}
              >
                <option value="">— выберите договор —</option>
                {contracts.map((contract) => (
                  <option key={contract.id} value={contract.number}>
                    {contract.number}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                value={form.contractNumber}
                onChange={(e) => set('contractNumber', e.target.value)}
                placeholder="Например, Д-2026/114"
              />
            )}
          </Field>

          <Field
            label="Рекламная кампания"
            required
            error={errors.name}
            hint={
              selectedContract && !selectedContract.campaignName
                ? 'В договоре кампания не указана — впишите название.'
                : undefined
            }
          >
            {selectedContract?.campaignName ? (
              <Select
                value={form.name}
                onChange={(e) => selectCampaign(e.target.value)}
              >
                <option value="">— выберите кампанию —</option>
                <option value={selectedContract.campaignName}>
                  {selectedContract.campaignName}
                </option>
              </Select>
            ) : (
              <Input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Например, Летняя распродажа"
              />
            )}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {isAdmin && (
            <Field label="Рекламодатель" required error={errors.advertiserId}>
              <Select
                value={form.advertiserId}
                onChange={(e) => setAdvertiser(e.target.value)}
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

        </div>

        {/* Лиги и ролик — одной строкой. */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Лиги">
            <MultiSelect
              options={LEAGUES}
              value={form.leagues}
              onChange={(v) => set('leagues', v)}
              placeholder="— не выбраны —"
            />
          </Field>

          <div>
            <p className="mb-1.5 text-[13px] font-medium text-ink-soft">
              Рекламный ролик
            </p>
            <div className="flex items-center gap-2">
              <FilePicker
                className="min-w-0 flex-1"
                accept="video/*"
                emptyLabel="Выбрать ролик"
                // Рекламодателю ролик приходит из договора — убрать его нельзя.
                removable={isAdmin}
                name={form.creativeName || fileNameFromUrl(form.creativeUrl)}
                url={form.creativeUrl}
                onPick={(picked) =>
                  setForm((f) => ({
                    ...f,
                    creativeUrl: picked?.url || '',
                    creativeName: picked?.name || '',
                  }))
                }
              />
              <CreativeLink
                url={isValidUrl(form.creativeUrl) ? form.creativeUrl : ''}
              />
            </div>
          </div>
        </div>

        {/* Условия договора — одинаковые при создании и редактировании. */}
        <div className="space-y-4 rounded-2xl ">

          {/* Юр. лицо ведёт админ — рекламодателю его не показываем. */}
          {isAdmin && (
            <Field label="Наименование юр. лица">
              <Input
                value={form.legalName}
                onChange={(e) => set('legalName', e.target.value)}
                placeholder='ООО «Пример»'
              />
            </Field>
          )}

         

          <div>
            <p className="mb-2 text-[13px] font-medium text-ink-soft">
              Срок договора
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Рекламодателю срок подставляется из договора и не правится. */}
              <Field label="Начало">
                <Input
                  type="date"
                  value={form.contractStart}
                  max={form.contractEnd || undefined}
                  disabled={!isAdmin}
                  onChange={(e) => set('contractStart', e.target.value)}
                />
              </Field>
              <Field label="Окончание" error={errors.contractEnd}>
                <Input
                  type="date"
                  value={form.contractEnd}
                  min={form.contractStart || undefined}
                  disabled={!isAdmin}
                  onChange={(e) => set('contractEnd', e.target.value)}
                />
              </Field>
            </div>
          </div>

          <ContractFile
            file={form.contractFile}
            readOnly={!isAdmin}
            onChange={(v) => set('contractFile', v)}
          />
        </div>
      </div>
    </Modal>
  )
}

/**
 * Поле выбора файла: клик по нему открывает системный диалог.
 * Небольшие файлы кладём в базу как data-URL, крупные держим ссылкой на сессию —
 * иначе они не помещаются в localStorage.
 */
function FilePicker({
  name,
  onPick,
  accept,
  emptyLabel,
  className,
  // Ролик из договора убирать нельзя — крестик показываем только админу.
  removable = true,
}) {
  const inputRef = useRef(null)
  const toast = useToast()

  const pick = (e) => {
    const picked = e.target.files?.[0]
    // Сбрасываем input, иначе повторный выбор того же файла не сработает.
    e.target.value = ''
    if (!picked) return
    if (picked.size <= MAX_CONTRACT_SIZE) {
      const reader = new FileReader()
      reader.onload = () =>
        onPick({ name: picked.name, url: String(reader.result) })
      reader.onerror = () => toast.error('Не удалось прочитать файл')
      reader.readAsDataURL(picked)
      return
    }
    onPick({ name: picked.name, url: URL.createObjectURL(picked) })
    toast.info('Файл больше 2 МБ — ссылка на него живёт до перезагрузки страницы')
  }

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={pick}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        title={name || emptyLabel}
        className={cn(
          'flex h-11 w-full items-center gap-2 rounded-xl border px-3.5 text-left text-sm transition-colors focus-ring',
          name
            ? 'border-line bg-surface text-ink hover:border-indigo-300'
            : 'border-dashed border-line bg-surface text-ink-soft hover:border-indigo-300 hover:bg-indigo-50',
        )}
      >
        {name ? (
          <Film size={16} className="shrink-0 text-indigo-800" />
        ) : (
          <Paperclip size={16} className="shrink-0 text-ink-muted" />
        )}
        <span className="min-w-0 flex-1 truncate">{name || emptyLabel}</span>
        {name && removable && (
          <span
            role="button"
            tabIndex={-1}
            aria-label="Убрать файл"
            title="Убрать файл"
            onClick={(e) => {
              e.stopPropagation()
              onPick(null)
            }}
            className="shrink-0 rounded-lg p-1 text-ink-muted transition-colors hover:bg-ink/[0.06] hover:text-ink"
          >
            <X size={14} />
          </span>
        )}
      </button>
    </div>
  )
}

/**
 * Загрузка скана договора — файл кладём в базу как data-URL.
 * readOnly — режим рекламодателя: договор грузит админ, здесь только скачать.
 */
function ContractFile({ file, onChange, readOnly = false }) {
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

  if (readOnly) {
    return (
      <div>
        <p className="mb-2 text-[13px] font-medium text-ink-soft">
          Файл договора
        </p>
        {file ? (
          <a
            href={file.url}
            download={file.name}
            className="flex w-full items-center gap-2 rounded-xl border border-line bg-paper/55 px-3 py-3 text-[13px] font-medium text-ink transition-colors hover:border-indigo-300 hover:bg-indigo-50 focus-ring"
            title={file.name}
          >
            <FileText size={16} className="shrink-0 text-indigo-800" />
            <span className="min-w-0 flex-1 truncate">{file.name}</span>
            <Download size={15} className="shrink-0 text-indigo-800" />
            Скачать договор
          </a>
        ) : (
          <p className="rounded-xl border border-dashed border-line px-3 py-3 text-center text-[13px] text-ink-muted">
            Договор ещё не загружен — его добавит менеджер.
          </p>
        )}
      </div>
    )
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
    </div>
  )
}
