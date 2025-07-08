import { useQuery } from '@tanstack/react-query'
import type { Room } from '~/types/room'

export function useRoom(roomID: string) {
  return useQuery<Room>({
    queryKey: ['room', roomID],
    queryFn: async ({ signal }) => {
      console.log('fetching room', roomID)
      const response = await fetch(`/chat/rooms/${roomID}`, { signal })
      return await response.json()
    },
  })
}
