// ── src/pages/errors/UnauthorizedPage.jsx ────────────────
import { useNavigate } from 'react-router-dom'
import { ShieldX, ArrowLeft } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function UnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="rounded-full bg-red-100 p-6 mb-6">
        <ShieldX className="h-12 w-12 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
      <p className="text-slate-500 max-w-md mb-8">
        You do not have permission to access this page. Contact your administrator if you believe this is an error.
      </p>
      <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/')}>
        Back to Dashboard
      </Button>
    </div>
  )
}
