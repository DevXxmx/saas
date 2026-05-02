// ── src/components/shared/CourseTypeBadge.jsx ────────────
import { Wifi, MapPin } from 'lucide-react'
import Badge from '@/components/ui/Badge'

export default function CourseTypeBadge({ type }) {
  if (type === 'online') {
    return (
      <Badge variant="info">
        <Wifi className="h-3 w-3 mr-1" />
        Online
      </Badge>
    )
  }
  return (
    <Badge variant="neutral">
      <MapPin className="h-3 w-3 mr-1" />
      Offline
    </Badge>
  )
}
