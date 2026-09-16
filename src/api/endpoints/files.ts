import { apiOrigin, request, requestBlob } from '../client'
import type { StoredFile } from '../types'

/**
 * Загрузчик файлов. Сервер проверяет тип и размер по назначению: скан
 * договора, рекламный ролик или логотип бренда.
 */
export type FileKind = 'contract' | 'creative' | 'logo'

/** POST /files — multipart. Дату загрузки проставляет сервер. */
export function upload(file: File, kind: FileKind): Promise<StoredFile> {
  const form = new FormData()
  form.append('file', file)
  form.append('kind', kind)
  return request<StoredFile>('/files', { method: 'POST', body: form })
}

/** Ссылка нашего хранилища — такой файл отдаётся только с токеном. */
export function isStoredUrl(url: string | null | undefined): boolean {
  return /\/api\/v1\/files\/[^/]+\/download\/?$/.test(url ?? '')
}

/**
 * Абсолютный адрес файла. Загрузчик отвечает относительной ссылкой, а
 * `creativeUrl` у кампании проверяется как URL и относительный путь
 * отклоняет (docs/backend.md, п. 3.4).
 */
export function absoluteUrl(url: string): string {
  if (!url || /^https?:\/\//i.test(url)) return url
  return `${apiOrigin()}${url.startsWith('/') ? '' : '/'}${url}`
}

/**
 * Содержимое файла. Ссылка может прийти и относительной, и абсолютной —
 * транспорт сам добавит origin и префикс `/api/v1`, поэтому снимаем оба.
 */
export function download(url: string): Promise<Blob> {
  const path = url.replace(/^https?:\/\/[^/]+/i, '').replace(/^\/api\/v1/, '')
  return requestBlob(path)
}
