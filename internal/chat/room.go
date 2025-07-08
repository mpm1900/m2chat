package chat

import (
	"errors"
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

func (r *Room) addClient(client *Client) error {
	_, ok := r.clients[client.ID]
	if ok {
		return errors.New("client already exists in this room")
	}
	r.clients[client.ID] = client
	return nil
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

func (r *Room) Run() {
	for {
		select {
		case client := <-r.register:
			err := r.addClient(client)
			if err != nil {
				log.Println(err)
				continue
			}
			r.refetch([]string{"room"}, client.ID)
			r.sendMessage(Message{
				ID:      NewID(),
				Type:    Connect,
				RoomID:  r.ID,
				To:      []ID{client.ID},
				Refetch: []string{"room"},
				Payload: client,
			})
		case client := <-r.unregister:
			r.removeClient(client)
			r.refetch([]string{"room"}, client.ID)
		case message := <-r.incoming:
			if message.To != nil {
				r.sendMessage(message)
			} else {
				r.broadcastMessage(message)
			}
		case req := <-r.request:
			dto := RoomDTO{
				ID:      r.ID,
				Name:    r.name,
				Clients: r.getClients(),
			}
			req.Response <- dto
		}
	}
}
