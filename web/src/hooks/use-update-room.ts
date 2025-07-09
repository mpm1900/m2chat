import { useMutation } from '@tanstack/react-query'
import type { Room } from '~/types/room'

export function useUpdateRoom(roomID: string) {
  return useMutation({
    mutationKey: ['update-room', roomID],
    mutationFn: async ({ room }: { room: Room }) => {
      console.log('updating room', roomID)
      const response = await fetch(`/chat/rooms/${roomID}`, {
        method: 'POST',
        body: JSON.stringify(room),
      })
      console.log(response)
    },
  })
}
