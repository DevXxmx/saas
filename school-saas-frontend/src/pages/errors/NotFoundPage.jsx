// ── src/pages/errors/NotFoundPage.jsx ────────────────────
import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="text-8xl font-black text-primary-200 mb-4">404</div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h1>
      <p className="text-slate-500 max-w-md mb-8">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="flex items-center gap-3">
        <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(-1)}>
          Go Back
        </Button>
        <Button variant="primary" icon={Home} onClick={() => navigate('/')}>
          Dashboard
        </Button>
      </div>
    </div>
  )
}
