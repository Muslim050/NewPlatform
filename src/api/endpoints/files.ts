import { request, requestBlob } from '../client'
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

/**
 * Содержимое файла. Ссылка в ответе приходит с префиксом `/api/v1` —
 * транспорт добавит его сам, поэтому здесь его снимаем.
 */
export function download(url: string): Promise<Blob> {
  return requestBlob(url.replace(/^\/api\/v1/, ''))
}
