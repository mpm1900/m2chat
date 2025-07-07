package chat

import (
	"errors"
	"log"
)

type Room struct {
	ID         ID
	name       string
	clients    map[ID]*Client
	register   chan *Client
	unregister chan *Client
	incoming   chan Message
	request    chan RoomRequest
}

type RoomDTO struct {
	ID      ID       `json:"id"`
	Name    string   `json:"name"`
	Clients []Client `json:"clients"`
}

type RoomRequest struct {
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
	}
}

func (r *Room) Get(req RoomRequest) {
	r.request <- req
}

func (r *Room) addClient(client *Client) {
	r.clients[client.ID] = client
}

func (r *Room) removeClient(client *Client) {
	if _, ok := r.clients[client.ID]; ok {
		delete(r.clients, client.ID)
		close(client.send)
	}
}

func (r *Room) sendMessage(message Message) error {
	client, ok := r.clients[message.To]
	if !ok {
		return errors.New("client not found")
	}

	log.Printf("[room=%s] sending message from %s to %s: %v", r.ID, message.ClientID, message.To, message)
	select {
	case client.send <- message:
	default:
		r.removeClient(client)
	}

	return nil
}

func (r *Room) broadcastMessage(message Message) {
	if message.To != "" {
		// log.Printf("[room=%s] broadcasting message from %s : %v", r.ID, message.ClientID, message)
	} else {
		// log.Printf("[room=%s] broadcasting message from SYSTEM : %v", r.ID, message)
	}
	for _, client := range r.clients {
		select {
		case client.send <- message:
		default:
			r.removeClient(client)
		}
	}
}

func (r *Room) refetch() {
	r.broadcastMessage(Message{
		ID:     NewID(),
		Type:   Refetch,
		RoomID: r.ID,
	})
}

func (r *Room) Run() {
	for {
		select {
		case client := <-r.register:
			r.addClient(client)
			r.refetch()
		case client := <-r.unregister:
			r.removeClient(client)
			r.refetch()
		case message := <-r.incoming:
			if message.To != "" {
				err := r.sendMessage(message)
				if err != nil {
					log.Printf("[room=%s] error sending message: %v", r.ID, err)
				}
			} else {
				r.broadcastMessage(message)
			}
		case req := <-r.request:
			clients := make([]Client, 0, len(r.clients))
			for _, client := range r.clients {
				clients = append(clients, *client)
			}
			res := RoomDTO{
				ID:      r.ID,
				Name:    r.name,
				Clients: clients,
			}
			req.Response <- res
		}
	}
}
