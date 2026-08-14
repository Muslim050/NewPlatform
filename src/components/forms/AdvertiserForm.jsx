import { useEffect, useState } from 'react'
import {
  Check,
  FileText,
  Film,
  Image as ImageIcon,
  Plus,
  Trash2,
} from 'lucide-react'
import { Logo } from '@/components/Logo.jsx'
import { useData } from '@/context/DataContext.jsx'
import { useToast } from '@/components/ui/Toast.jsx'
import { Modal } from '@/components/ui/Modal.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Field, Input, Select, Textarea } from '@/components/ui/Field.jsx'
import { MultiSelect } from '@/components/ui/MultiSelect.jsx'
import { FilePicker } from '@/components/ui/FilePicker.jsx'
import { SegmentTabs } from '@/components/ui/Tabs.jsx'
import { LEAGUES, PACKAGES } from '@/lib/metrics.js'
import { uid } from '@/lib/id.js'
import { cn } from '@/lib/cn.js'

const CATEGORIES = [
  'Финансы',
  'Телеком',
  'Ритейл',
  'Авто',
  'Красота',
  'Технологии',
  'Медиа',
  'Другое',
]

const PALETTE = [
  '#FFD106',
  '#0EA5E9',
  '#12A150',
  '#E5484D',
  '#8B5CF6',
  '#F59E0B',
  '#EC4899',
]

const emptyForm = {
  name: '',
  contact: '',
  email: '',
  category: 'Финансы',
  status: 'active',
  balance: '',
  legalName: '',
  requisites: '',
  color: PALETTE[0],
  // Логотип бренда: { name, url } либо null.
  logo: null,
  contracts: [],
}

/** В базе логотип хранится ссылкой — в форме к нему добавляем имя файла. */
const logoToFile = (logo) => {
  if (!logo) return null
  // У загруженного файла ссылка вида data:/blob: — имени в ней нет.
  const inline = logo.startsWith('data:') || logo.startsWith('blob:')
  return {
    name: inline ? 'Логотип бренда' : logo.split('/').pop() || 'Логотип',
    url: logo,
  }
}

const REQUISITES_LABELS = {
  inn: 'ИНН',
  account: 'Р/с',
  bank: 'Банк',
  mfo: 'МФО',
  oked: 'ОКЭД',
  vat: 'НДС',
  address: 'Адрес',
  phone: 'Телефон',
  email: 'Email',
}

/** В старых записях реквизиты лежат объектом — в форме показываем их текстом. */
const requisitesToText = (requisites) => {
  if (!requisites) return ''
  if (typeof requisites === 'string') return requisites
  return Object.entries(REQUISITES_LABELS)
    .filter(([key]) => requisites[key])
    .map(([key, label]) => `${label}: ${requisites[key]}`)
    .join('\n')
}

/** Пустой договор бренда — из него кампания берёт номер и условия. */
const newContract = (legalName = '') => ({
  id: uid('ctr'),
  number: '',
  // Рекламная кампания, под которую заключён договор.
  campaignName: '',
  legalName,
  package: '',
  leagues: [],
  start: '',
  end: '',
  paymentDate: `${new Date().getFullYear()}-08-31`,
  file: null,
  // Ролик договора — подставляется в кампании по этому договору.
  creative: null,
})

export function AdvertiserForm({ open, onClose, initial }) {
  const { create, update } = useData()
  const toast = useToast()
  const editing = !!initial
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [tab, setTab] = useState('main')
  // Подтверждение на кнопке: карточка после сохранения остаётся открытой.
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => setSaved(false), 1600)
    return () => clearTimeout(timer)
  }, [saved])

  useEffect(() => {
    if (!open) return
    setTab('main')
    setForm(
      initial
        ? {
            name: initial.name,
            contact: initial.contact,
            email: initial.email,
            category: initial.category,
            status: initial.status,
            balance: String(initial.balance),
            legalName: initial.legalName || '',
            requisites: requisitesToText(initial.requisites),
            color: initial.color,
            logo: logoToFile(initial.logo),
            contracts: (initial.contracts ?? []).map((contract) => ({
              ...contract,
              leagues: [...(contract.leagues ?? [])],
            })),
          }
        : emptyForm,
    )
    setErrors({})
    setSaved(false)
    // Зависимости — по id: после сохранения бренд в сторе обновится, и форма
    // иначе сбросила бы несохранённые правки сама на себя.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const addContract = () =>
    setForm((f) => ({
      ...f,
      contracts: [...f.contracts, newContract(f.legalName.trim())],
    }))

  const setContract = (id, patch) =>
    setForm((f) => ({
      ...f,
      contracts: f.contracts.map((contract) =>
        contract.id === id ? { ...contract, ...patch } : contract,
      ),
    }))

  const removeContract = (id) =>
    setForm((f) => ({
      ...f,
      contracts: f.contracts.filter((contract) => contract.id !== id),
    }))

  const submit = () => {
    const err = {}
    if (!form.name.trim()) err.name = 'Укажите название'
    if (!form.email.trim() || !form.email.includes('@'))
      err.email = 'Некорректный email'
    setErrors(err)
    if (Object.keys(err).length) return

    const payload = {
      name: form.name.trim(),
      contact: form.contact.trim(),
      email: form.email.trim(),
      category: form.category,
      status: form.status,
      balance: Number(form.balance) || 0,
      legalName: form.legalName.trim(),
      requisites: form.requisites.trim(),
      color: form.color,
      logo: form.logo?.url ?? null,
      // Договоры без номера не сохраняем — из них нечего выбирать в кампании.
      contracts: form.contracts
        .filter((contract) => contract.number.trim())
        .map((contract) => ({
          ...contract,
          number: contract.number.trim(),
          campaignName: (contract.campaignName ?? '').trim(),
          legalName: contract.legalName.trim(),
        })),
    }

    if (editing) {
      update('advertisers', initial.id, payload)
      toast.success(`Карточка бренда ${payload.name} сохранена`)
      // Карточку не закрываем: правки часто идут подряд — договоры, реквизиты.
      setSaved(true)
      return
    }

    create('advertisers', payload)
    toast.success(`Рекламодатель ${payload.name} добавлен`)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      logo={<Logo size={40} withWord={false} />}
      title={editing ? 'Редактировать рекламодателя' : 'Новый рекламодатель'}
      description="Карточка бренда с контактами."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {editing ? 'Закрыть' : 'Отмена'}
          </Button>
          <Button variant="primary" onClick={submit} disabled={saved}>
            {saved ? (
              <>
                <Check size={16} />
                Сохранено
              </>
            ) : editing ? (
              'Сохранить'
            ) : (
              'Добавить'
            )}
          </Button>
        </>
      }
    >
      <SegmentTabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'main', label: 'Реквизиты' },
          { value: 'contracts', label: 'Договоры', count: form.contracts.length },
        ]}
      />

      <div className={cn('space-y-4', tab !== 'main' && 'hidden')}>
        <Field label="Название бренда" required error={errors.name}>
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Например, Artel"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Контактное лицо">
            <Input
              value={form.contact}
              onChange={(e) => set('contact', e.target.value)}
              placeholder="Имя Фамилия"
            />
          </Field>
          <Field label="Email" required error={errors.email}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="name@brand.ru"
            />
          </Field>

        </div>

        {/* Подставляется в договоры бренда и в кампании. */}
        <Field label="Наименование юр. лица">
          <Input
            value={form.legalName}
            onChange={(e) => set('legalName', e.target.value)}
            placeholder='ООО «Пример»'
          />
        </Field>

        <Field label="Реквизиты" hint="По строке на пункт: ИНН, банк, счёт, адрес.">
          <Textarea
            rows={7}
            value={form.requisites}
            onChange={(e) => set('requisites', e.target.value)}
            className="min-h-[164px]"
            placeholder={'ИНН: 311985311\nБанк: ГО АК «Алокабанк», г. Ташкент\nМФО: 00401\nР/с: 20208000407214976001\nАдрес: г. Ташкент, ул. Elbek, 8'}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Цвет бренда">
            <div className="flex flex-wrap gap-2 pt-1">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('color', c)}
                  className={cn(
                    'h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-surface transition-all',
                    form.color === c
                      ? 'ring-ink/40 scale-110'
                      : 'ring-transparent',
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </Field>

          {/* Логотип показывается вместо инициалов в карточках и таблицах. */}
          <Field
            label="Логотип рекламодателя"
            hint="PNG или JPG, лучше квадратный."
          >
            <div className="flex items-center gap-3">
              {form.logo?.url && (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-black/5">
                  <img
                    src={form.logo.url}
                    alt=""
                    className="h-full w-full object-contain p-1"
                  />
                </span>
              )}
              <FilePicker
                accept="image/*"
                icon={ImageIcon}
                emptyLabel="Загрузить логотип"
                name={form.logo?.name}
                url={form.logo?.url}
                onPick={(logo) => set('logo', logo)}
                className="min-w-0 flex-1"
              />
            </div>
          </Field>
        </div>
      </div>

      <div className={cn('space-y-3', tab !== 'contracts' && 'hidden')}>
        {!form.contracts.length && (
          <div className="rounded-2xl border border-dashed border-line p-6 text-center">
            <FileText size={24} className="mx-auto text-ink-muted" />
            <p className="mt-3 text-sm font-medium text-ink-soft">
              Договоров пока нет
            </p>
            <p className="mt-1 text-[13px] text-ink-muted">
              Из этих договоров рекламодатель выбирает номер при создании кампании.
            </p>
          </div>
        )}

        {form.contracts.map((contract, index) => (
          <div
            key={contract.id}
            className="space-y-4 rounded-2xl border border-line bg-paper/55 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Договор {index + 1}
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 px-0"
                onClick={() => removeContract(contract.id)}
                title="Удалить договор"
                aria-label={`Удалить договор ${index + 1}`}
              >
                <Trash2 size={15} />
              </Button>
            </div>

            {/* Срок договора идёт первым — с него заполняют карточку. */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Начало">
                <Input
                  type="date"
                  value={contract.start}
                  max={contract.end || undefined}
                  onChange={(e) =>
                    setContract(contract.id, { start: e.target.value })
                  }
                />
              </Field>
              <Field label="Окончание">
                <Input
                  type="date"
                  value={contract.end}
                  min={contract.start || undefined}
                  onChange={(e) =>
                    setContract(contract.id, { end: e.target.value })
                  }
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Номер договора" required>
                <Input
                  value={contract.number}
                  onChange={(e) =>
                    setContract(contract.id, { number: e.target.value })
                  }
                  placeholder="Например, Д-2026/114"
                />
              </Field>
              <Field label="Файл договора">
                <FilePicker
                  accept=".pdf,.doc,.docx,image/*"
                  emptyLabel="Загрузить договор"
                  downloadLabel="Скачать договор"
                  name={contract.file?.name}
                  url={contract.file?.url}
                  onPick={(file) => setContract(contract.id, { file })}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Под какую рекламную кампанию заключён договор. */}
              <Field label="Название рекламной кампании">
                <Input
                  value={contract.campaignName ?? ''}
                  onChange={(e) =>
                    setContract(contract.id, { campaignName: e.target.value })
                  }
                  placeholder="Например, Кондиционеры — лето"
                />
              </Field>
              {/* Ролик договора подставляется в кампании по этому договору. */}
              <Field label="Рекламный ролик">
                <FilePicker
                  accept="video/*"
                  icon={Film}
                  emptyLabel="Загрузить ролик"
                  downloadLabel="Скачать ролик"
                  name={contract.creative?.name}
                  url={contract.creative?.url}
                  onPick={(creative) => setContract(contract.id, { creative })}
                />
              </Field>
            </div>

            {/* Юр. лицо и сроки оплаты берём из карточки бренда и договора —
                в самой форме договора их не спрашиваем. */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Пакет">
                <Select
                  value={contract.package}
                  onChange={(e) =>
                    setContract(contract.id, { package: e.target.value })
                  }
                >
                  <option value="">— не выбран —</option>
                  {Object.entries(PACKAGES).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Лиги" hint="Можно выбрать несколько.">
                <MultiSelect
                  options={LEAGUES}
                  value={contract.leagues}
                  onChange={(leagues) => setContract(contract.id, { leagues })}
                  placeholder="— не выбраны —"
                />
              </Field>
            </div>

          </div>
        ))}

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={addContract}>
            <Plus size={16} />
            Добавить договор
          </Button>
          {/* Договоры живут в карточке бренда — сохраняются вместе с ней. */}
          <p className="text-[12px] text-ink-muted">
            Договоры сохранятся вместе с карточкой — нажмите «
            {editing ? 'Сохранить' : 'Добавить'}» внизу.
          </p>
        </div>
      </div>
    </Modal>
  )
}
