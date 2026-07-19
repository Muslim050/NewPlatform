import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button.jsx'
import { Logo } from '@/components/Logo.jsx'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper px-6 text-center">
      <Logo size={40} />
      <div>
        <p className="font-display text-[80px] font-semibold leading-none text-ink">
          404
        </p>
        <p className="mt-2 text-ink-muted">Такой страницы нет.</p>
      </div>
      <Link to="/app">
        <Button variant="primary">На главную</Button>
      </Link>
    </div>
  )
}
