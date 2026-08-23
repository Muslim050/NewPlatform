import type { Role, User } from '@/api/types'

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Администратор',
  viewer: 'Наблюдатель',
  advertiser: 'Рекламодатель',
}

/**
 * Подпись пользователя в шапке и сайдбаре. У учётной записи может не быть
 * заполненного имени — тогда показываем роль, чтобы место не пустовало.
 */
export function userTitle(user: Pick<User, 'name' | 'role'>): string {
  return user.name?.trim() || ROLE_LABELS[user.role]
}

/** Подпись под именем: почта, если она есть, иначе роль. */
export function userSubtitle(
  user: Pick<User, 'name' | 'email' | 'role'>,
): string {
  const email = user.email?.trim()
  if (email) return email
  // Имя уже показано вместо роли — второй раз её не повторяем.
  return user.name?.trim() ? ROLE_LABELS[user.role] : ''
}
