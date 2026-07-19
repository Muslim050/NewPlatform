import { useEffect, useState } from 'react'
import { Building2 } from 'lucide-react'
import { useData } from '@/context/DataContext.jsx'
import { useToast } from '@/components/ui/Toast.jsx'
import { Modal } from '@/components/ui/Modal.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Field, Input, Select } from '@/components/ui/Field.jsx'
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
  '#4F46E5',
  '#0EA5E9',
  '#12A150',
  '#C2E834',
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
  color: PALETTE[0],
}

export function AdvertiserForm({ open, onClose, initial }) {
  const { create, update } = useData()
  const toast = useToast()
  const editing = !!initial
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!open) return
    setForm(
      initial
        ? {
            name: initial.name,
            contact: initial.contact,
            email: initial.email,
            category: initial.category,
            status: initial.status,
            balance: String(initial.balance),
            color: initial.color,
          }
        : emptyForm,
    )
    setErrors({})
  }, [open, initial])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

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
      color: form.color,
    }

    if (editing) {
      update('advertisers', initial.id, payload)
      toast.success('Рекламодатель обновлён')
    } else {
      create('advertisers', payload)
      toast.success('Рекламодатель добавлен')
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={Building2}
      title={editing ? 'Редактировать рекламодателя' : 'Новый рекламодатель'}
      description="Карточка бренда с контактами и балансом."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button variant="primary" onClick={submit}>
            {editing ? 'Сохранить' : 'Добавить'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Название бренда" required error={errors.name}>
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Например, Северный Банк"
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
          <Field label="Категория">
            <Select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Статус">
            <Select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
            >
              <option value="active">Активен</option>
              <option value="paused">На паузе</option>
            </Select>
          </Field>
        </div>

        <Field label="Баланс">
          <Input
            type="number"
            min="0"
            value={form.balance}
            onChange={(e) => set('balance', e.target.value)}
            placeholder="1000000"
          />
        </Field>

        <Field label="Цвет бренда">
          <div className="flex flex-wrap gap-2 pt-1">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set('color', c)}
                className={cn(
                  'h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-surface transition-all',
                  form.color === c ? 'ring-ink/40 scale-110' : 'ring-transparent',
                )}
                style={{ background: c }}
              />
            ))}
          </div>
        </Field>
      </div>
    </Modal>
  )
}
