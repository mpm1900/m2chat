export type Room = {
  id: string
  name: string
  clients: RoomClient[]
}

export type RoomClient = {
  id: string
  userID: string
  userName: string
}
