package server

import (
	"flag"
	"log"
	"net/http"

	"github.com/mpm1900/m2chat/internal/chat"
)

var addr = flag.String("addr", ":3005", "http service address")

func NewServer() *http.Server {
	mux := http.NewServeMux()
	handler := chat.NewChatHandler(mux)
	server := &http.Server{
		Addr:    *addr,
		Handler: handler,
	}

	room := chat.NewRoom()
	go room.Run()

	fs := http.FileServer(http.Dir("./web/dist"))
	mux.Handle("/", fs)

	mux.HandleFunc("GET /ws", func(w http.ResponseWriter, r *http.Request) {
		client := chat.NewClient(room)
		if err := client.Connect(w, r); err != nil {
			log.Println(err)
			return
		}
		client.Subscribe()
	})

	return server
}
