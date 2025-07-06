package chat

import (
	"errors"
	"log"

	"github.com/google/uuid"
)

type Room struct {
	ID         uint32
	name       string
	clients    map[uint32]*Client
	register   chan *Client
	unregister chan *Client
	incoming   chan Message
	request    chan RoomRequest
}

type RoomResponse struct {
	ID          uint32 `json:"id"`
	Name        string `json:"name"`
	ClientCount int    `json:"clientCount"`
}

type RoomRequest struct {
	Response chan<- RoomResponse
}

func NewRoom() *Room {
	return &Room{
		ID:         uuid.New().ID(),
		name:       "Untitled Room",
		clients:    make(map[uint32]*Client),
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
	log.Printf("[room=%d] registering %d", r.ID, client.ID)
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

	log.Printf("[room=%d] sending message from %d to %d: %v", r.ID, message.ClientID, message.To, message)
	select {
	case client.send <- message:
	default:
		r.removeClient(client)
	}

	return nil
}

func (r *Room) broadcastMessage(message Message) {
	log.Printf("[room=%d] broadcasting message from %d : %v", r.ID, message.ClientID, message)
	for _, client := range r.clients {
		select {
		case client.send <- message:
		default:
			r.removeClient(client)
		}
	}
}

func (r *Room) Run() {
	for {
		select {
		case client := <-r.register:
			r.addClient(client)
			r.broadcastMessage(Message{
				Type:   Refetch,
				RoomID: r.ID,
			})
		case client := <-r.unregister:
			r.removeClient(client)
			r.broadcastMessage(Message{
				Type:   Refetch,
				RoomID: r.ID,
			})
		case message := <-r.incoming:
			if message.To != 0 {
				err := r.sendMessage(message)
				if err != nil {
					log.Printf("[room=%d] error sending message: %v", r.ID, err)
				}
			} else {
				r.broadcastMessage(message)
			}
		case req := <-r.request:
			res := RoomResponse{
				ID:          r.ID,
				Name:        r.name,
				ClientCount: len(r.clients),
			}
			req.Response <- res
		}
	}
}
