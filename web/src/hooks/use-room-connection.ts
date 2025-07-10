import { useEffect } from 'react'
import { createStore, useStore } from 'zustand'
import type { ClientMessage, Message } from '~/types/message'
import type { RoomClient } from '~/types/room'
import { userStore } from './use-user'

type MessageType = Message['type'] | '*' | 'connect'
type EventCallback = (message: Message) => void
type EventMap = Map<MessageType, Set<EventCallback>>

type RoomConnectionState = {
  conn: WebSocket | null
  connected: boolean
  eventEmitter: EventMap
  messageLog: Message[]
  roomID: string | null
  client: RoomClient | null
}
type RoomConnectionActions = {
  connect: (roomID: string) => WebSocket
  disconnect: () => void
  on: (messageType: MessageType, callback: EventCallback) => () => void
  off: (messageType: MessageType, callback: EventCallback) => void
  send: (message: Omit<ClientMessage, 'clientID'>) => void
}
type RoomConnectionStore = RoomConnectionActions & RoomConnectionState

export const roomConnectionStore = createStore<RoomConnectionStore>(
  (set, get) => {
    function reset() {
      set({
        eventEmitter: new Map(),
        messageLog: [],
      })
    }

    function emit(messageType: Exclude<MessageType, '*'>, message: Message) {
      const { eventEmitter } = get()
      if (message) {
        set((s) => ({ ...s, messageLog: [...s.messageLog, message] }))
      }
      if (eventEmitter.has(messageType) || eventEmitter.has('*')) {
        eventEmitter.get(messageType)?.forEach((callback) => callback(message))
        eventEmitter.get('*')?.forEach((callback) => callback(message))
      }
    }

    return {
      conn: null,
      connected: false,
      eventEmitter: new Map(),
      messageLog: [],
      roomID: null,
      client: null,

      connect: (roomID: string) => {
        const user = userStore.getState().user
        const currentConn = get().conn
        if (currentConn && currentConn.readyState === WebSocket.OPEN) {
          currentConn.close(1000, 'New connection initiated')
        }

        let conn: WebSocket | null = new WebSocket(
          `/chat/rooms/${roomID}/ws?userID=${user.id}&userName=${user.name}`,
        )
        set({ conn, roomID })

        conn.onopen = () => {
          console.log('WebSocket OPEN')
          set({ connected: true })
        }
        conn.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            message.timestamp = new Date()
            if (message.type === 'connect') {
              console.log('connected to room', message)
              set({ client: message.payload, roomID: message.roomID })
            }
            if (message && message.type) {
              emit(message.type, message)
            }
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e)
          }
        }

        conn.onclose = () => {
          const { conn: _conn } = get()
          console.log('WebSocket CLOSED', conn)
          if (_conn === conn) {
            set({ connected: false })
            if (conn && roomID) {
              get().connect(roomID)
            }
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
      send: (message) => {
        const { conn } = get()
        console.log('SENDING', conn)
        if (conn) {
          conn.send(JSON.stringify(message))
        }
      },
    }
  },
)

export function useRoomConnection<T = unknown>(
  selector: (state: RoomConnectionStore) => T,
) {
  return useStore(roomConnectionStore, selector)
}

export const roomConnectionActions: RoomConnectionActions =
  roomConnectionStore.getState()

export function useRoomEvent(
  messageTypes: MessageType[],
  callback: EventCallback,
) {
  useEffect(() => {
    const unsubscribe = messageTypes.map((messageType) =>
      roomConnectionActions.on(messageType, callback),
    )
    return () => {
      unsubscribe.forEach((fn) => fn())
    }
  }, [messageTypes.join(','), callback])
}
