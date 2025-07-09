import { useQuery } from '@tanstack/react-query'
import type { Room } from '~/types/room'

export function useRooms() {
  return useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: async ({ signal }) => {
      console.log('fetching rooms')
      const response = await fetch('/chat/rooms', { signal })
      return (await response.json()) ?? []
    },
    gcTime: 0,
  })
}
