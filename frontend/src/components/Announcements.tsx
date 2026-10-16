import { Notices } from './Notices'

export function Announcements({ canManage }: { canManage?: boolean }) {
  return <Notices canManage={canManage} />
}
