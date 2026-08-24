import { useEffect, useState } from 'react'
import { UserCog } from 'lucide-react'
import { useSaveUser } from '@/features/users/queries'
import { useAdvertisers } from '@/features/advertisers/queries'
import { ROLE_LABELS } from '@/features/auth/user'
import { useToast } from '@/components/ui/Toast.jsx'
import { Modal } from '@/components/ui/Modal.jsx'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'

const ROLES = ['admin', 'viewer', 'advertiser']

const emptyForm = {
  login: '',
  name: '',
  email: '',
  role: 'viewer',
  advertiserId: '',
  isActive: true,
  password: '',
}

/** Пользователь с сервера → состояние формы. Пароль наружу не приходит. */
const formFrom = (user) => ({
  login: user.login,
  name: user.name ?? '',
  email: user.email ?? '',
  role: user.role,
  advertiserId: user.advertiserId ? String(user.advertiserId) : '',
  isActive: user.isActive,
  password: '',
})

/**
 * Карточка пользователя платформы. Роль решает, что человек увидит:
 * рекламодателю нужен бренд, площадке и наблюдателю — нет.
 */
export function UserForm({ open, onClose, initial }) {
  const { mutate: saveUser, isPending } = useSaveUser()
  // Бренд выбирается из тех же рекламодателей, что и в остальных разделах.
  const { data: advertisers } = useAdvertisers()
  const toast = useToast()
  const editing = !!initial
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!open) return
    setForm(initial ? formFrom(initial) : emptyForm)
    setErrors({})
    // Зависимости — по id: после сохранения список обновится, и форма иначе
    // сбросила бы несохранённые правки сама на себя.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = () => {
    const err = {}
    if (!form.login.trim()) err.login = 'Укажите логин'
    if (form.email.trim() && !form.email.includes('@'))
      err.email = 'Некорректный email'
    // Пароль обязателен только у нового: у существующего пустое поле значит
    // «оставить прежний».
    if (!editing && !form.password) err.password = 'Задайте пароль'
    if (form.role === 'advertiser' && !form.advertiserId)
      err.advertiserId = 'Выберите бренд'
    setErrors(err)
    if (Object.keys(err).length) return

    const user = {
      login: form.login.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      // Бренд есть только у рекламодателя — у остальных ролей его снимаем.
      advertiserId:
        form.role === 'advertiser' ? Number(form.advertiserId) : null,
      isActive: form.isActive,
    }
    if (form.password) user.password = form.password

    saveUser(
      { id: initial?.id, user },
      {
        onSuccess: () => {
          toast.success(
            editing
              ? `Пользователь ${user.login} сохранён`
              : `Пользователь ${user.login} добавлен`,
          )
          onClose()
        },
        onError: (err2) => {
          // Сервер вернул ошибки по полям — показываем их прямо в форме.
          if (err2.fields && Object.keys(err2.fields).length) {
            setErrors(err2.fields)
          }
          toast.error(err2.message || 'Не удалось сохранить пользователя')
        },
      },
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={UserCog}
      title={editing ? 'Редактировать пользователя' : 'Новый пользователь'}
      description="Доступ к платформе и роль."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button variant="primary" onClick={submit} disabled={isPending}>
            {isPending ? 'Сохраняем…' : editing ? 'Сохранить' : 'Добавить'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Логин" required error={errors.login}>
            <Input
              value={form.login}
              onChange={(e) => set('login', e.target.value)}
              placeholder="ivanov"
              autoComplete="off"
            />
          </Field>
          <Field label="Имя">
            <Input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Имя Фамилия"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" error={errors.email}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="name@setanta.uz"
            />
          </Field>
          <Field
            label="Пароль"
            required={!editing}
            error={errors.password}
            hint={
              editing ? 'Пусто — прежний пароль останется как есть.' : undefined
            }
          >
            <Input
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              placeholder={editing ? '••••••' : 'Не короче 8 символов'}
              autoComplete="new-password"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Роль"
            hint="Наблюдатель видит всё, но ничего не меняет."
          >
            <Select
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </Select>
          </Field>
          {/* Бренд спрашиваем только у рекламодателя: остальные видят всех. */}
          {form.role === 'advertiser' && (
            <Field label="Бренд" required error={errors.advertiserId}>
              <Select
                value={form.advertiserId}
                onChange={(e) => set('advertiserId', e.target.value)}
              >
                <option value="">— не выбран —</option>
                {(advertisers ?? []).map((advertiser) => (
                  <option key={advertiser.id} value={advertiser.id}>
                    {advertiser.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>

        <Field
          label="Доступ"
          hint="Отключённый пользователь остаётся в списке, но войти не может."
        >
          <Select
            value={form.isActive ? 'active' : 'inactive'}
            onChange={(e) => set('isActive', e.target.value === 'active')}
          >
            <option value="active">Активен</option>
            <option value="inactive">Отключён</option>
          </Select>
        </Field>
      </div>
    </Modal>
  )
}
