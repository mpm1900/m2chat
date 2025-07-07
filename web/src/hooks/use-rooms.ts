import { useQuery } from '@tanstack/react-query'
import type { Room } from '~/types/room'

export function useRooms() {
  return useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const response = await fetch('/chat/rooms')
      return (await response.json()) ?? []
    },
  })
}
