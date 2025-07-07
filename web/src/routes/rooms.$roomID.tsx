import { createFileRoute, Link } from '@tanstack/react-router'
import { buttonVariants } from '~/components/ui/button'
import {
  roomConnectionActions,
  useRoomConnection,
  useRoomEvent,
} from '~/hooks/use-room-connection'
import { useRooms } from '~/hooks/use-rooms'

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
  const { roomID } = Route.useParams()
  console.log('roomID', roomID)
  const log = useRoomConnection((state) => state.messageLog)
  const rooms = useRooms()

  useRoomEvent('refetch', () => {
    rooms.refetch()
  })

  return (
    <div className="flex flex-row gap-4">
      <div>
        <div>Rooms:</div>
        {rooms.isLoading && <div> Loading Rooms...</div>}
        {rooms.data?.map((room) => (
          <Link
            key={room.id}
            from={`/rooms/$roomID`}
            to={`/rooms/$roomID`}
            params={{ roomID: room.id }}
            className={buttonVariants({
              variant: room.id === roomID ? 'secondary' : 'link',
            })}
          >
            {room.id} ({room.clients.length})
          </Link>
        ))}
      </div>
      <div>
        <div>Hello "/rooms/$roomID"!</div>
        <div>Log:</div>
        <pre>{JSON.stringify(log, null, 2)}</pre>
      </div>
    </div>
  )
}
