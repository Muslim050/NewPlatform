import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, VolumeX } from 'lucide-react'
import { useAuth } from '@/context/AuthContext.jsx'
import { useData } from '@/context/DataContext.jsx'
import { Logo } from '@/components/Logo.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Field, Input } from '@/components/ui/Field.jsx'

const TV_SPOTS = [
  '/creatives/setanta-2.mp4',
]

const AUDIENCE_STATS = [
  {
    value: '9 800 000+',
    label: 'Пользователей всего',
    position: 'left-1/2 top-[20.5%] -translate-x-1/2',
    primary: true,
  },
  { value: '93M', label: 'Зрителей', position: 'right-[2%] top-[27.5%]' },
  { value: '23M', label: 'ТВ-аудитория', position: 'right-[0.5%] top-[38%]' },
  {
    value: '285 000+',
    label: 'Активных зрителей у партнёров',
    position: 'right-[0.5%] top-[48.5%]',
  },
  { value: '35', label: 'Платформ', position: 'left-[0.5%] top-[48.5%]' },
  { value: '15', label: 'Стран', position: 'left-[0.5%] top-[38%]' },
  { value: '5', label: 'Языков', position: 'left-[2%] top-[27.5%]' },
]

function AudienceStatsOrbit({ stats }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-40 hidden 2xl:block">
      <div className="absolute left-1/2 top-[42%] h-[36%] w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-dashed border-lime-300/10" />

      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={`absolute ${stat.position} ${stat.primary ? 'w-[220px]' : 'w-[168px]'}`}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: [0, index % 2 === 0 ? -4 : 4, 0] }}
            transition={{
              opacity: { delay: 0.58 + index * 0.07, duration: 0.45 },
              scale: { delay: 0.58 + index * 0.07, duration: 0.45 },
              y: {
                delay: 1.1 + index * 0.06,
                duration: 4.8 + index * 0.18,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }}
            className={`relative overflow-hidden rounded-xl border px-3.5 py-2.5 shadow-[0_16px_42px_rgba(0,0,0,0.34)] backdrop-blur-xl ${
              stat.primary
                ? 'border-lime-300/25 bg-[#151923]/90'
                : 'border-white/10 bg-[#111522]/82'
            }`}
          >
            <div className="absolute inset-y-2.5 left-0 w-0.5 rounded-full bg-lime-300/80" />
            <span className="absolute right-3 top-2.5 text-[8px] font-semibold tracking-[0.16em] text-white/25">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div
              className={`font-display font-semibold leading-none text-lime-300 tnum ${
                stat.primary ? 'text-xl' : 'text-lg'
              }`}
            >
              {stat.value}
            </div>
            <div className="mt-1.5 pr-4 text-[9px] font-semibold uppercase leading-[1.3] tracking-[0.1em] text-white">
              {stat.label}
            </div>
          </motion.div>
        </div>
      ))}
    </div>
  )
}

function TvShowcase() {
  const [activeSpot, setActiveSpot] = useState(0)

  const playNextSpot = () => {
    setActiveSpot((current) => (current + 1) % TV_SPOTS.length)
  }

  return (
    <aside className="relative hidden min-h-screen overflow-hidden bg-[#090b13] lg:block">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_64%,rgba(255,209,6,0.28),transparent_28%),radial-gradient(circle_at_93%_12%,rgba(255,209,6,0.12),transparent_24%),radial-gradient(circle_at_5%_88%,rgba(255,209,6,0.14),transparent_30%)]" />
      <div className="absolute inset-0 bg-grid-fade [background-size:24px_24px] opacity-[0.22] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
      <div className="absolute left-1/2 top-[48%] h-[46vw] max-h-[720px] w-[46vw] max-w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-400/10" />
      <div className="absolute left-1/2 top-[48%] h-[34vw] max-h-[530px] w-[34vw] max-w-[530px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-300/[0.07]" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/10" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-40 px-10 pt-10 xl:px-14 xl:pt-12"
      >
        <h2 className="mt-5 max-w-xl font-display text-[55px] font-semibold leading-[0.98] tracking-[-0.035em] text-lime-300">
          STAY IN THE GAME.
        </h2>
        <p className="mt-4 max-w-md text-[20px] leading-relaxed text-white/70">
         В УЗБЕКИСТАНЕ ВЕДЕТСЯ ТРАНСЛЯЦИЯ 2Х ТЕЛЕКАНАЛОВ
        </p>

      </motion.div>

      <AudienceStatsOrbit stats={AUDIENCE_STATS} />

      <div className="absolute bottom-0 left-1/2 z-20 aspect-[1672/941] w-[132%] -translate-x-1/2">
        <motion.div
          initial={{ opacity: 0, scale: 1.025, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-full w-full"
        >
          <img
            src="/family-tv-video-frame.png"
            alt="Семья смотрит телевизор"
            className="pointer-events-none absolute inset-0 z-20 h-full w-full select-none object-contain"
            draggable="false"
          />

          <div
            data-testid="tv-video-frame"
            className="absolute z-10 overflow-hidden bg-[#050607]"
            style={{ left: '24.22%', top: '12.11%', width: '51.91%', height: '40.28%' }}
          >
            <motion.video
              data-testid="tv-video"
              key={TV_SPOTS[activeSpot]}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45 }}
              src={TV_SPOTS[activeSpot]}
              className="h-full w-full object-cover"
              autoPlay
              muted
              playsInline
              preload="auto"
              onEnded={playNextSpot}
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(118deg,rgba(255,255,255,0.12),transparent_25%,transparent_72%,rgba(0,0,0,0.16))]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/45 to-transparent px-[3.5%] pb-[3%] pt-[9%] text-white">
              <span className="flex items-center gap-1.5 text-[clamp(5px,0.62vw,10px)] font-semibold uppercase tracking-[0.16em]">
                <i className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime-300" />
                В эфире
              </span>
              <span className="flex items-center gap-1 text-white/70">
                <VolumeX className="h-[clamp(7px,0.8vw,12px)] w-[clamp(7px,0.8vw,12px)]" />
                <span className="text-[clamp(5px,0.58vw,9px)] tabular-nums">
                  {String(activeSpot + 1).padStart(2, '0')} / {String(TV_SPOTS.length).padStart(2, '0')}
                </span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-30 h-16 bg-gradient-to-t from-black/30 to-transparent" />
    </aside>
  )
}

export default function Login() {
  const { login } = useAuth()
  const { advertisers } = useData()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const login_ = username.trim().toLowerCase()

    if (login_ === 'admin' && password === 'admin') {
      login({ role: 'admin', name: 'admin', email: 'admin@setantasports.com' })
      navigate('/app')
      return
    }

    if (login_ === 'adv' && password === 'adv') {
      const a = advertisers[0]
      login({
        role: 'advertiser',
        advertiserId: a.id,
        name: a.contact,
        email: a.email,
      })
      navigate('/app')
      return
    }

    setError('Неверный логин или пароль')
  }

  return (
    <main className="grid min-h-screen bg-paper lg:grid-cols-[minmax(420px,0.84fr)_minmax(0,1.16fr)]">
      <section className="relative z-50 flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_15%_18%,rgba(255,209,6,0.11),transparent_31%),linear-gradient(145deg,#faf9f6,#f3f1ec)] px-6 py-12 shadow-[18px_0_55px_rgba(0,0,0,0.18)] sm:px-10">
        <div className="pointer-events-none absolute -left-28 top-[18%] h-64 w-64 rounded-full border border-indigo-500/[0.06]" />
        <div className="pointer-events-none absolute -left-16 top-[23%] h-40 w-40 rounded-full border border-indigo-500/[0.08]" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[520px] lg:rounded-[32px] lg:border lg:border-white/90 lg:bg-white/65 lg:p-10 lg:shadow-[0_32px_90px_-48px_rgba(34,27,80,0.42)] lg:backdrop-blur-xl"
        >
          <Logo size={40} />

          <div className="mt-10">
            <h1 className="text-display-md text-ink text-base">
              С возвращением
            </h1>

          </div>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Логин">
              <Input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setError('')
                }}
                placeholder="admin"
                autoComplete="username"
                autoFocus
              />
            </Field>

            <Field label="Пароль" error={error}>
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                placeholder="••••••"
                autoComplete="current-password"
              />
            </Field>

            <Button size="lg" variant="primary" type="submit" className="w-full">
              Войти в платформу
              <ArrowRight size={18} />
            </Button>
          </form>


        </motion.div>
      </section>

      <TvShowcase />
    </main>
  )
}
