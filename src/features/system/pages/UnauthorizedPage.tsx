import { ShieldAlert } from 'lucide-react'
import { SystemMessage } from './SystemMessage'

export function UnauthorizedPage() {
  return <SystemMessage title="Access restricted" message="Your role doesn't include access to this screen. Ask an HR admin if you need it." icon={<ShieldAlert size={22} />} />
}
