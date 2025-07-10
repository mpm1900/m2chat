import type { RoomClient } from './room'

export type ConnectMessage = {
  id: string
  type: 'connect'
  roomID: string
  refetch: string[]
  payload: RoomClient

  timestamp?: Date
}

export type SystemMessage = {
  id: string
  type: 'system'
  roomID: string
  refetch?: string[]
  text?: string
  payload?: {
    client: RoomClient
  }

  timestamp?: Date
}

export type ChatMessage = {
  id: string
  type: 'chat'
  roomID: string
  clientID: string
  userID: string
  userName: string
  text: string

  timestamp?: Date
}

export type SystemChatMessage = {
  id: string
  type: 'system:chat'
  roomID: string
  clientID?: string
  refetch?: string[]
  text: string
}

export type Message =
  | ConnectMessage
  | SystemMessage
  | ChatMessage
  | SystemChatMessage
export type ClientMessage = ChatMessage
