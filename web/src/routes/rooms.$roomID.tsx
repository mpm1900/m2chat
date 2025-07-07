import { createFileRoute } from '@tanstack/react-router'
import {
  roomConnectionActions,
  useRoomConnection,
} from '~/hooks/use-room-connection'

export const Route = createFileRoute('/rooms/$roomID')({
  component: RouteComponent,
  onEnter: (route) => {
    roomConnectionActions.connect(route.params.roomID)
  },
  onLeave: () => {
    roomConnectionActions.disconnect()
  },
})

function RouteComponent() {
  const log = useRoomConnection((state) => state.messageLog)
  return (
    <div>
      <div>Hello "/rooms/$roomID"!</div>
      <div>Log:</div>
      <pre>{JSON.stringify(log, null, 2)}</pre>
    </div>
  )
}
