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

На экране входа введите логин и пароль. Доступны три учётки:

- `admin` / `admin` — полный доступ;
- `viewer` / `viewer` — те же экраны, что у админа, но без права что-либо менять;
- `adv` / `adv` — доступ рекламодателя (первый бренд из демо-данных).

Пароли живут в мок-транспорте (`src/api/mock/auth.ts`) — единственном месте,
которое исчезнет с появлением настоящего `/auth/login`.

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

React 18 · Vite 5 · React Router 6 · Tailwind CSS · TanStack Query · Zustand ·
Framer Motion · lucide-react. Графики — собственные на чистом SVG
(без сторонних чарт-библиотек).

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
                     токен, разбор ошибок { error: { code, message, fields } }
  endpoints/       — функции по разделам спеки (auth, …)
  mock/            — временная реализация, пока бэкенда нет
  types.ts         — доменные типы из docs/backend-spec.md
src/features/*/queries.ts — хуки TanStack Query поверх endpoints
src/stores/       — Zustand: клиентское состояние (сессия)
```

Пока `VITE_API_URL` пуст, запросы обслуживает мок-транспорт. Появится сервер —
задайте переменную (см. `.env.example`), и код эндпоинтов менять не придётся.

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
