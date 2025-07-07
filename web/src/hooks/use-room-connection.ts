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
}
type RoomConnectionStore = RoomConnectionActions & RoomConnectionState

export const roomConnectionStore = createStore<RoomConnectionStore>(
  (set, get) => {
    function reset() {
      set({
        conn: null,
        eventEmitter: new Map(),
        messageLog: [],
      })
    }

    function emit(message: Message) {
      const { eventEmitter } = get()
      if (eventEmitter.has(message.type)) {
        eventEmitter.get(message.type)?.forEach((callback) => callback(message))
        eventEmitter.get('*')?.forEach((callback) => callback(message))
      }
    }

    return {
      conn: null,
      eventEmitter: new Map(),
      messageLog: [],

      connect: (roomID: string) => {
        const currentConn = get().conn
        if (currentConn && currentConn.readyState === WebSocket.OPEN) {
          currentConn.close(1000, 'New connection initiated')
        }

        const conn = new WebSocket(`/chat/rooms/${roomID}/ws`)
        set({ conn })

        conn.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            if (message && message.type) {
              emit(message)
            }
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e)
          }
        }

        conn.onclose = () => {
          if (get().conn === conn) {
            set({ conn: null })
          }
        }

        conn.onerror = (error) => {
          console.error('WebSocket error:', error)
        }

        return conn
      },
      disconnect: (reason?: string) => {
        console.log('disconnecting from room')
        get().conn?.close(1000, reason)
        reset()
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
    }
  },
)

export function useRoomConnection(
  selector: (state: RoomConnectionStore) => unknown,
) {
  return useStore(roomConnectionStore, selector)
}

export const roomConnectionActions: RoomConnectionActions =
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
