package chat

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"sync"
	"time"
)

type ChatHandler struct {
	mux     *http.ServeMux
	rooms   map[uint32]*Room
	roomsMu sync.RWMutex
}

func NewChatHandler(mux *http.ServeMux) *ChatHandler {
	handler := &ChatHandler{
		mux:   mux,
		rooms: make(map[uint32]*Room),
	}

	mux.HandleFunc("GET /chat/rooms/{roomID}", func(w http.ResponseWriter, r *http.Request) {
		roomID, err := strconv.ParseUint(r.PathValue("roomID"), 10, 32)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		log.Printf("roomID: %d", roomID)
		room, ok := handler.getRoom(uint32(roomID))
		if !ok {
			w.WriteHeader(http.StatusNotFound)
			w.Write([]byte("room not found"))
			return
		}

		res := make(chan RoomResponse, 1)
		req := RoomRequest{
			Response: res,
		}

		select {
		case room.request <- req:
			select {
			case data := <-res:
				w.WriteHeader(http.StatusOK)
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(data)
			case <-time.After(time.Second):
				w.WriteHeader(http.StatusInternalServerError)
				w.Write([]byte("timeout"))
				return
			}
		case <-time.After(time.Second):
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte("timeout"))
			return
		}
	})

	mux.HandleFunc("GET /chat/rooms/{roomID}/ws", handler.handleWs)
	return handler
}

func (ch *ChatHandler) getRoom(roomID uint32) (*Room, bool) {
	ch.roomsMu.RLock()
	defer ch.roomsMu.RUnlock()
	room, ok := ch.rooms[roomID]
	return room, ok
}

func (ch *ChatHandler) getOrCreateRoom(roomID uint32) *Room {
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
	log.Printf("created room: %d", roomID)
	return room
}

func (ch *ChatHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	ch.mux.ServeHTTP(w, r)
}

func (ch *ChatHandler) handleWs(w http.ResponseWriter, r *http.Request) {
	roomID, err := strconv.ParseUint(r.PathValue("roomID"), 10, 32)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(err.Error()))
		return
	}
	log.Printf("roomID: %d", roomID)
	room := ch.getOrCreateRoom(uint32(roomID))

	client := NewClient(room)
	if err := client.Connect(w, r); err != nil {
		log.Println(err)
		return
	}
	client.Subscribe()
}
