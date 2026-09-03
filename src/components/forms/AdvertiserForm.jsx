import { useEffect, useState } from 'react'
import {
  Check,
  Download,
  FileText,
  Film,
  Image as ImageIcon,
  Plus,
  Trash2,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { useSaveAdvertiser } from '@/features/advertisers/queries'
import { contractFileInput } from '@/features/contracts/files'
import { useFileDownload } from '@/features/files/queries'
import { useToast } from '@/components/ui/Toast.jsx'
import { Modal } from '@/components/ui/Modal.jsx'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { MultiSelect } from '@/components/ui/MultiSelect.jsx'
import { FilePicker } from '@/components/ui/FilePicker.jsx'
import { SegmentTabs } from '@/components/ui/Tabs.jsx'
import { ADV_STATUS, LEAGUES, PACKAGES } from '@/lib/metrics.js'
import { formatDateTime } from '@/lib/format.js'
import { uid } from '@/lib/id.js'
import { cn } from '@/lib/cn.js'

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

/** Слепок договоров — по нему понимаем, менялся ли раздел «Договоры». */
const contractsFingerprint = (contracts = []) =>
  JSON.stringify(
    contracts.map((contract) => ({
      id: contract.id,
      number: (contract.number ?? '').trim(),
      campaignName: (contract.campaignName ?? '').trim(),
      legalName: (contract.legalName ?? '').trim(),
      package: contract.package ?? '',
      leagues: [...(contract.leagues ?? [])],
      start: contract.start ?? '',
      end: contract.end ?? '',
      paymentDate: contract.paymentDate ?? '',
      file: contract.file?.url ?? null,
      creative: contract.creative?.url ?? null,
    })),
  )

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

/**
 * Файл, выбранный в форме, живёт как data:/blob:-URL. Сервер принимает
 * в `logo` только абсолютную ссылку, поэтому такие значения он отвергает.
 */
const isInlineFile = (url) =>
  !!url && (url.startsWith('data:') || url.startsWith('blob:'))

/** Пустая строка в поле-дате означает «не задано» — сервер ждёт null. */
const dateOrNull = (value) => (value?.trim() ? value : null)

/**
 * Оставляет у договора только то, что принимает API: суммы он здесь
 * не редактирует. Файлы едут отдельными полями — id из загрузчика.
 */
const toContractInput = (contract, before) => ({
  id: contract.id,
  number: contract.number.trim(),
  campaignName: (contract.campaignName ?? '').trim(),
  legalName: (contract.legalName ?? '').trim(),
  package: contract.package ?? '',
  leagues: [...(contract.leagues ?? [])],
  start: dateOrNull(contract.start),
  end: dateOrNull(contract.end),
  paymentDate: dateOrNull(contract.paymentDate),
  ...contractFileInput(contract, before),
})

/** Карточка с сервера → состояние формы. */
const formFrom = (advertiser) => ({
  name: advertiser.name,
  contact: advertiser.contact,
  email: advertiser.email,
  category: advertiser.category,
  status: advertiser.status,
  balance: String(advertiser.balance),
  legalName: advertiser.legalName || '',
  requisites: requisitesToText(advertiser.requisites),
  color: advertiser.color,
  logo: logoToFile(advertiser.logo),
  contracts: (advertiser.contracts ?? []).map((contract) => ({
    ...contract,
    leagues: [...(contract.leagues ?? [])],
  })),
})

export function AdvertiserForm({ open, onClose, initial }) {
  const { mutate: saveAdvertiser, isPending } = useSaveAdvertiser()
  // Скачивание на сервере закрыто токеном — тянем файл транспортом.
  const { save: saveFile } = useFileDownload()
  const toast = useToast()
  const editing = !!initial
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [tab, setTab] = useState('main')
  // Подтверждение на кнопке: карточка после сохранения остаётся открытой.
  const [saved, setSaved] = useState(false)
  // Карточка в том виде, в каком она сейчас на сервере. После сохранения
  // заменяется свежим ответом: там уже есть id созданных договоров, и с ним
  // же сравниваются следующие правки.
  const [source, setSource] = useState(initial)

  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => setSaved(false), 1600)
    return () => clearTimeout(timer)
  }, [saved])

  useEffect(() => {
    if (!open) return
    setTab('main')
    setSource(initial)
    setForm(initial ? formFrom(initial) : emptyForm)
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

    const advertiser = {
      name: form.name.trim(),
      contact: form.contact.trim(),
      email: form.email.trim(),
      category: form.category,
      status: form.status,
      // Суммы на сервере — decimal, то есть строка.
      balance: String(Number(form.balance) || 0),
      legalName: form.legalName.trim(),
      requisites: form.requisites.trim(),
      color: form.color,
    }

    // Логотип API хранит ссылкой не длиннее 500 символов, поэтому файл,
    // выбранный в форме (data:-URL), отправить нельзя — нужен загрузчик
    // файлов на бэкенде. Ссылку отправляем, файл молча не теряем: прежнее
    // значение остаётся на сервере.
    const logo = form.logo?.url ?? null
    const inlineLogo = isInlineFile(logo)
    // Ссылку отправляем, выбранный файл — нет: сервер его не примет,
    // а прежнее значение при этом остаётся нетронутым.
    if (!inlineLogo) advertiser.logo = logo ?? ''

    // Договоры без номера не сохраняем — из них нечего выбирать в кампании.
    const previousById = new Map(
      (source?.contracts ?? []).map((contract) => [contract.id, contract]),
    )
    const contracts = form.contracts
      .filter((contract) => contract.number.trim())
      .map((contract) =>
        toContractInput(contract, previousById.get(contract.id)),
      )

    const contractsChanged =
      contractsFingerprint(contracts) !==
      contractsFingerprint(source?.contracts)

    saveAdvertiser(
      {
        id: source?.id,
        advertiser,
        contracts,
        previousAdvertiser: source,
        previousContracts: source?.contracts ?? [],
      },
      {
        onSuccess: (fresh) => {
          // Форма остаётся открытой — переносим её на свежее состояние,
          // иначе следующее сохранение повторит уже выполненные правки.
          setSource(fresh)
          setForm(formFrom(fresh))
          if (inlineLogo) {
            toast.info(
              'Файл логотипа не сохранён: сервер принимает только ссылку',
            )
          }
          if (editing) {
            // Про договоры говорим отдельно — их правят чаще остального.
            toast.success(
              contractsChanged
                ? `Раздел «Договоры» у рекламодателя ${advertiser.name} успешно обновлён`
                : `Карточка бренда ${advertiser.name} сохранена`,
            )
            // Карточку не закрываем: правки часто идут подряд.
            setSaved(true)
            return
          }
          toast.success(`Рекламодатель ${advertiser.name} добавлен`)
          onClose()
        },
        onError: (err) => {
          // Сервер вернул ошибки по полям — показываем их прямо в форме.
          if (err.fields && Object.keys(err.fields).length) {
            setErrors(err.fields)
          }
          toast.error(err.message || 'Не удалось сохранить рекламодателя')
        },
      },
    )
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
          <Button
            variant="primary"
            onClick={submit}
            disabled={saved || isPending}
          >
            {saved ? (
              <>
                <Check size={16} />
                Сохранено
              </>
            ) : isPending ? (
              'Сохраняем…'
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
          {
            value: 'contracts',
            label: 'Договоры',
            count: form.contracts.length,
          },
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

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Подставляется в договоры бренда и в кампании. */}
          <Field label="Наименование юр. лица">
            <Input
              value={form.legalName}
              onChange={(e) => set('legalName', e.target.value)}
              placeholder="ООО «Пример»"
            />
          </Field>

          {/* Тот же статус, что в плитке бренда: активен или расторгнут. */}
          <Field label="Статус">
            <Select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
            >
              {Object.entries(ADV_STATUS).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label="Реквизиты"
          hint="По строке на пункт: ИНН, банк, счёт, адрес."
        >
          <Textarea
            rows={7}
            value={form.requisites}
            onChange={(e) => set('requisites', e.target.value)}
            className="min-h-[164px]"
            placeholder={
              'ИНН: 311985311\nБанк: ГО АК «Алокабанк», г. Ташкент\nМФО: 00401\nР/с: 20208000407214976001\nАдрес: г. Ташкент, ул. Elbek, 8'
            }
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
            hint="Сервер сохраняет только ссылку: вставьте адрес картинки. Файл можно выбрать для предпросмотра, но на сервер он не уйдёт — там пока нет хранилища файлов."
          >
            <Input
              value={isInlineFile(form.logo?.url) ? '' : (form.logo?.url ?? '')}
              onChange={(e) => {
                const url = e.target.value.trim()
                set(
                  'logo',
                  url ? { name: url.split('/').pop() || 'Логотип', url } : null,
                )
              }}
              placeholder="https://example.com/logo.png"
              inputMode="url"
              className="mb-2"
            />
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
                kind="logo"
                local
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
              Из этих договоров рекламодатель выбирает номер при создании
              кампании.
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
                  kind="contract"
                  emptyLabel="Загрузить договор"
                  downloadLabel="Скачать договор"
                  name={contract.file?.name}
                  url={contract.file?.url}
                  addedAt={contract.file?.addedAt}
                  onPick={(file) => setContract(contract.id, { file })}
                />
              </Field>
            </div>

            {/* Название рекламной кампании и ролик заполняет рекламодатель
                в своей карточке договора — здесь только показываем. */}
            <div className="rounded-2xl border border-line bg-paper/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                От рекламодателя
              </p>
              <p className="mt-2 text-[13px]">
                <span className="text-ink-muted">Рекламная кампания: </span>
                <span className="font-medium text-ink">
                  {contract.campaignName || 'не заполнена'}
                </span>
              </p>
              {contract.creative ? (
                <>
                  <button
                    type="button"
                    onClick={() => saveFile(contract.creative)}
                    className="mt-2 flex w-full items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-left text-[13px] font-medium text-ink transition-colors hover:border-indigo-300 hover:bg-indigo-50 focus-ring"
                  >
                    <Film size={16} className="shrink-0 text-indigo-800" />
                    <span className="min-w-0 flex-1 truncate">
                      {contract.creative.name}
                    </span>
                    <Download size={15} className="shrink-0 text-ink-muted" />
                  </button>
                  {contract.creative.addedAt && (
                    <p className="mt-1 text-[11px] text-ink-muted tnum">
                      Ролик добавлен {formatDateTime(contract.creative.addedAt)}
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-[13px] text-ink-muted">
                  Ролик не загружен
                </p>
              )}
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
