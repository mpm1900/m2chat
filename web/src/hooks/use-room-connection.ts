import { createStore, useStore } from 'zustand'
import { useEffect } from 'react'

type Message = {
  type: 'refetch'
}

type EventCallback = (message: Message) => void
type EventMap = Map<Message['type'] | '*', Set<EventCallback>>

type RoomConnectionState = {
  conn: WebSocket | null
  eventEmitter: EventMap
  messageLog: Message[]
}
type RoomConnectionActions = {
  connect: (roomID: string) => WebSocket
  disconnect: () => void
  on: (
    messageType: Message['type'] | '*',
    callback: EventCallback,
  ) => () => void
  off: (messageType: Message['type'] | '*', callback: EventCallback) => void
  emit: (message: Message) => void
}
type RoomConnectionStore = RoomConnectionActions & RoomConnectionState

export const roomConnectionStore = createStore<RoomConnectionStore>(
  (set, get) => ({
    conn: null,
    eventEmitter: new Map(),
    messageLog: [],

    connect: (roomID: string) => {
      const conn = new WebSocket(`/chat/rooms/${roomID}/ws`)
      set({ conn, messageLog: [] })

      conn.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          get().emit(message)
          set({ messageLog: [...get().messageLog, message] })
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e)
        }
      }

      conn.onclose = () => {
        set({ conn: null })
      }

      conn.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      return conn
    },
    disconnect: () => {
      get().conn?.close()
      set({ conn: null })
    },
    on: (messageType, callback) => {
      const { eventEmitter } = get()
      if (!eventEmitter.has(messageType)) {
        eventEmitter.set(messageType, new Set())
      }
      eventEmitter.get(messageType)?.add(callback)
      return () => get().off(messageType, callback)
    },
    off: (messageType, callback) => {
      const { eventEmitter } = get()
      if (eventEmitter.has(messageType)) {
        eventEmitter.get(messageType)?.delete(callback)
        if (eventEmitter.get(messageType)?.size === 0) {
          eventEmitter.delete(messageType)
        }
      }
    },
    emit: (message) => {
      const { eventEmitter } = get()
      if (eventEmitter.has(message.type)) {
        eventEmitter.get(message.type)?.forEach((callback) => callback(message))
        eventEmitter.get('*')?.forEach((callback) => callback(message))
      }
    },
  }),
)

export function useRoomConnection(
  selector: (state: Omit<RoomConnectionStore, 'emit'>) => unknown,
) {
  return useStore(roomConnectionStore, selector)
}

export const roomConnectionActions: Omit<RoomConnectionActions, 'emit'> =
  roomConnectionStore.getState()

export function useRoomEvent(
  eventType: Message['type'] | '*',
  callback: EventCallback,
) {
  useEffect(() => {
    const unsubscribe = roomConnectionActions.on(eventType, callback)
    return () => {
      unsubscribe()
    }
  }, [eventType, callback])
}
