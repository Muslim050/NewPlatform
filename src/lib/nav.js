import {
  LayoutDashboard,
  Megaphone,
  Building2,
  Radio,
  LineChart,
} from 'lucide-react'

export const NAV = [
  {
    to: '/app/campaigns',
    label: 'Кампании',
    icon: Megaphone,
    roles: ['admin', 'viewer', 'advertiser'],
  },
  {
    to: '/app/overview',
    label: 'Обзор',
    icon: LayoutDashboard,
    roles: ['admin', 'viewer'],
  },
  {
    to: '/app/advertisers',
    label: 'Рекламодатели',
    icon: Building2,
    roles: ['admin', 'viewer'],
  },
  {
    to: '/app/channels',
    label: 'Площадки',
    icon: Radio,
    roles: ['admin', 'viewer', 'advertiser'],
    hidden: true,
  },
  {
    to: '/app/reports',
    label: 'Отчёт',
    icon: LineChart,
    roles: ['advertiser'],
  },
]
