package chat

import (
	"log"
	"slices"
)

type Room struct {
	ID         ID
	name       string
	clients    map[ID]*Client
	register   chan *Client
	unregister chan *Client
	incoming   chan Message
	request    chan RoomRequest
	mutate     chan RoomMutation
}

type RoomDTO struct {
	ID      ID       `json:"id"`
	Name    string   `json:"name"`
	Clients []Client `json:"clients"`
}

type RoomRequest struct {
	Response chan<- RoomDTO
}

type RoomMutation struct {
	DTO      RoomDTO
	Response chan<- RoomDTO
}

func NewRoom() *Room {
	return &Room{
		ID:         NewID(),
		name:       "Untitled Room",
		clients:    make(map[ID]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		incoming:   make(chan Message, 256),
		request:    make(chan RoomRequest),
		mutate:     make(chan RoomMutation),
	}
}

func (r *Room) Get(req RoomRequest) {
	r.request <- req
}

func (r *Room) addClient(client *Client) {
	_, ok := r.clients[client.ID]
	if ok {
		log.Println("client already exists in this room")
		return
	}
	r.clients[client.ID] = client
}

func (r *Room) removeClient(client *Client) {
	if _, ok := r.clients[client.ID]; ok {
		delete(r.clients, client.ID)
		close(client.send)
	}
}

func (r *Room) getClients() []Client {
	var clients = make([]Client, 0, len(r.clients))
	for _, client := range r.clients {
		clients = append(clients, *client)
	}
	return clients
}

func (r *Room) sendMessage(message Message) {
	for _, to := range message.To {
		client, ok := r.clients[to]
		if !ok || slices.Contains(message.Omit, client.ID) {
			continue
		}
		select {
		case client.send <- message:
		default:
			log.Println("failed to send message to client, REMOVE", client.ID)
			r.removeClient(client)
		}
	}
}

func (r *Room) broadcastMessage(message Message) {
	for _, client := range r.clients {
		if slices.Contains(message.Omit, client.ID) {
			continue
		}
		select {
		case client.send <- message:
		default:
			log.Println("failed to send message to client, REMOVE", client.ID)
			r.removeClient(client)
		}
	}
}

func (r *Room) refetch(keys []string, omit ...ID) {
	r.broadcastMessage(Message{
		ID:      NewID(),
		Type:    System,
		RoomID:  r.ID,
		Omit:    omit,
		Refetch: keys,
	})
}

func (r *Room) broadcastJoinMessage(client Client, refetch []string) {
	r.broadcastMessage(Message{
		ID:      NewID(),
		Type:    SystemChat,
		RoomID:  r.ID,
		Omit:    []ID{client.ID},
		Refetch: refetch,
		Text:    client.UserName + " joined the room.",
	})
}

func (r *Room) broadcastLeaveMessage(client Client, refetch []string) {
	r.broadcastMessage(Message{
		ID:      NewID(),
		Type:    SystemChat,
		RoomID:  r.ID,
		Omit:    []ID{client.ID},
		Refetch: refetch,
		Text:    client.UserName + " left the room.",
	})
}

func (r *Room) sendConnectMessage(client Client) {
	r.broadcastMessage(Message{
		ID:      NewID(),
		Type:    Connect,
		RoomID:  r.ID,
		To:      []ID{client.ID},
		Refetch: []string{"room"},
		Payload: client,
	})
}

func (r *Room) Dto() RoomDTO {
	return RoomDTO{
		ID:      r.ID,
		Name:    r.name,
		Clients: r.getClients(),
	}
}

func (r *Room) Run() {
	for {
		select {
		case client := <-r.register:
			r.addClient(client)
			r.sendConnectMessage(*client)
			r.broadcastJoinMessage(*client, []string{"room"})
		case client := <-r.unregister:
			r.removeClient(client)
			r.broadcastLeaveMessage(*client, []string{"room"})
		case message := <-r.incoming:
			if message.To != nil {
				r.sendMessage(message)
			} else {
				r.broadcastMessage(message)
			}
		case req := <-r.request:
			req.Response <- r.Dto()
		case req := <-r.mutate:
			r.name = req.DTO.Name
			req.Response <- r.Dto()
			r.refetch([]string{"room", "rooms"})
		}
	}
}
