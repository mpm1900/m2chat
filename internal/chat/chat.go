package chat

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"
)

type ChatHandler struct {
	mux     *http.ServeMux
	rooms   map[ID]*Room
	roomsMu sync.RWMutex
}

func NewChatHandler() *ChatHandler {
	handler := &ChatHandler{
		mux:   http.NewServeMux(),
		rooms: make(map[ID]*Room),
	}

	handler.mux.HandleFunc("GET /chat/rooms/{roomID}/ws", handler.handleWs)
	handler.mux.HandleFunc("GET /chat/rooms/{roomID}", handler.handleGetRoom)
	handler.mux.HandleFunc("GET /chat/rooms", handler.handleGetAllRooms)

	handler.getOrCreateRoom(NewID())

	return handler
}

func (ch *ChatHandler) getRoom(roomID ID) (*Room, bool) {
	ch.roomsMu.RLock()
	defer ch.roomsMu.RUnlock()
	room, ok := ch.rooms[roomID]
	return room, ok
}

func (ch *ChatHandler) getOrCreateRoom(roomID ID) *Room {
	room, ok := ch.getRoom(roomID)
	if ok {
		return room
	}

	ch.roomsMu.Lock()
	defer ch.roomsMu.Unlock()
	room = NewRoom()
	room.ID = roomID
	ch.rooms[roomID] = room

	go room.Run()
	log.Printf("created room: %s", roomID)
	return room
}

func (ch *ChatHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	ch.mux.ServeHTTP(w, r)
}

func timeout(w http.ResponseWriter) {
	w.WriteHeader(http.StatusInternalServerError)
	w.Write([]byte("timeout"))
}

func (ch *ChatHandler) handleWs(w http.ResponseWriter, r *http.Request) {
	roomID := r.PathValue("roomID")
	query := r.URL.Query()
	clientID := query.Get("clientID")

	room := ch.getOrCreateRoom(ID(roomID))
	client := NewClient(room)
	client.ID = ID(clientID)
	if err := client.Connect(w, r); err != nil {
		log.Println(err)
		return
	}
	client.Subscribe()
}

func (ch *ChatHandler) handleGetRoom(w http.ResponseWriter, r *http.Request) {
	roomID := r.PathValue("roomID")
	room, ok := ch.getRoom(ID(roomID))
	if !ok {
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte("room not found"))
		return
	}

	response := make(chan RoomDTO, 1)
	req := RoomRequest{
		Response: response,
	}

	select {
	case room.request <- req:
		select {
		case data := <-response:
			w.WriteHeader(http.StatusOK)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(data)
		case <-time.After(time.Second):
			timeout(w)
			return
		}
	case <-time.After(time.Second):
		timeout(w)
		return
	}
}

func (ch *ChatHandler) handleGetAllRooms(w http.ResponseWriter, r *http.Request) {
	log.Println("GET /chat/rooms")
	ch.roomsMu.RLock()
	defer ch.roomsMu.RUnlock()

	var roomDTOs []RoomDTO
	for _, room := range ch.rooms {
		response := make(chan RoomDTO, 1)
		req := RoomRequest{
			Response: response,
		}

		select {
		case room.request <- req:
			select {
			case data := <-response:
				roomDTOs = append(roomDTOs, data)
			case <-time.After(time.Second):
				timeout(w)
				continue
			}
		case <-time.After(time.Second):
			timeout(w)
			continue
		}
	}

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(roomDTOs)
}
