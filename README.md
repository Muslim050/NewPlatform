# Setanta Sports Platform

Фронтенд рекламной платформы. Бэкенда пока нет: данные лежат в `localStorage`
браузера и переживают перезагрузку. Требования к API описаны в
[docs/backend-spec.md](docs/backend-spec.md).

Визуальный язык: светлый премиум-минимал на фирменном жёлтом Setanta,
шрифты Setantica + Noto Sans, мягкие тени, стекло, анимации на Framer Motion.

## Запуск

```bash
cd newplatform
npm install
npm run dev
```

Откроется на `http://localhost:5178`.

## Доступы (демо)

Вход идёт через настоящий бэкенд: `POST /api/v1/auth/login`. По схеме в дев-базе
заведены `admin/admin`, `viewer/viewer` и `adv/adv`, но на текущем стенде отвечает
только `admin` — остальные две возвращают 401.

Профиль в шапке и сайдбаре берётся из `GET /auth/me`: запрос уходит при входе
в авторизованную часть приложения, поэтому данные не устаревают между сессиями.
Если у учётной записи не заполнено имя, вместо него показывается роль.

Сессия — пара JWT. `access` живёт 15 минут и ходит в `Authorization: Bearer`;
когда он истекает, транспорт сам меняет его через `POST /auth/refresh` и повторяет
запрос. Присланный refresh при этом гасится и заменяется новым, поэтому обновление
идёт строго по одному за раз (см. `src/api/client.ts`).

Данные и доступы отличаются:

| Раздел        |   admin    |     viewer      |           adv            |
| ------------- | :--------: | :-------------: | :----------------------: |
| Обзор         | все данные |   все данные    |          скрыт           |
| Кампании      | все + CRUD | все, без правки | только свои + CRUD своих |
| Рекламодатели |    CRUD    | только просмотр |          скрыт           |
| Площадки      |    CRUD    | только просмотр |     только просмотр      |
| Отчёты        |   скрыт    |      скрыт      |     по своему бренду     |

Полная матрица прав — в §1 [docs/backend-spec.md](docs/backend-spec.md).

## CRUD

Полностью рабочие create / edit / delete для **кампаний**, **рекламодателей**
и **площадок**. Изменения реактивно обновляют интерфейс и сохраняются в `localStorage`
(ключ `bloom.db.v12`). Чтобы вернуть демо-данные — очистите этот ключ в DevTools
или вызовите `resetDb()` из `src/lib/store.js`.

## Стек

React 19 · Vite 8 · Tailwind CSS 4 · TanStack Router · TanStack Query ·
Zustand · Framer Motion · lucide-react. Графики — собственные на чистом SVG
(без сторонних чарт-библиотек).

Тема оформления живёт в CSS-блоке `@theme` в `src/index.css` —
отдельного `tailwind.config.js` в Tailwind 4 нет.

Проект переезжает на TypeScript постепенно: новый код пишем на `.ts`/`.tsx`,
старый остаётся на `.jsx` и не проверяется (`checkJs: false`).

```bash
npm run lint       # ESLint
npm run format     # Prettier
npm run typecheck  # tsc --noEmit
```

## Слой запросов

Все обращения к API идут через `src/api`, а не из компонентов:

```
src/api/
  client.ts        — единственная точка выхода в сеть: префикс /api/v1,
                     токен, обновление истёкшего access, разбор ошибок
                     { error: { code, message, fields } }
  endpoints/       — функции по разделам API (auth, …)
  token.ts         — держатель пары JWT для транспорта
  types.ts         — доменные типы из схемы API
src/features/*/queries.ts — хуки TanStack Query поверх endpoints
src/stores/       — Zustand: клиентское состояние (сессия)
src/router.tsx    — дерево маршрутов TanStack Router; доступ к разделам
                    проверяется в beforeLoad, то есть до рендера страницы
```

Бэкенд: <https://setanta.pythonanywhere.com>, схема — `/api/v1/schema`,
Swagger — `/api/v1/docs`.

**CORS.** Сервер не отдаёт `Access-Control-Allow-Origin`, поэтому напрямую из
браузера к нему не достучаться. Запросы идут на собственный origin, а дальше их
переправляет прокси: `server.proxy` в `vite.config.js` для разработки и `rewrites`
в `vercel.json` для продакшена. Когда на бэкенде настроят CORS, прокси можно убрать
и указать адрес в `VITE_API_URL`.

**На API переведён только вход.** Остальные разделы по-прежнему читают демо-данные
из `localStorage` — см. раздел «CRUD» ниже.

## Структура

```
src/
  api/         — слой запросов (см. выше)
  components/
    ui/        — дизайн-система (Button, Card, Modal, Field, Toast, …)
    charts/    — SVG-графики (Area, Bar, Donut, Sparkline)
    forms/     — модальные формы CRUD
    layout/    — AppShell, Sidebar, Topbar
  context/     — DataContext (CRUD-store)
  features/    — логика по доменам: auth (useAuth, queries)
  stores/      — Zustand-сторы (authStore)
  lib/         — store (localStorage), seed, metrics, format, queryClient, хуки
  pages/       — Login, Dashboard, Campaigns, Advertisers, Channels, Reports
```
