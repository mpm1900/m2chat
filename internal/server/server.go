package server

import (
	"flag"
	"net/http"

	"github.com/mpm1900/m2chat/internal/chat"
)

var addr = flag.String("addr", ":3005", "http service address")

type Server struct {
	*http.Server
}

func NewServer() *Server {
	mux := http.NewServeMux()

	chatHandler := chat.NewChatHandler()
	spaHandler := &SpaHandler{
		staticPath: "./web/dist",
		indexPath:  "index.html",
	}

	mux.Handle("/chat/", chatHandler)
	mux.Handle("/", spaHandler)

	return &Server{
		Server: &http.Server{
			Addr:    *addr,
			Handler: mux,
		},
	}
}
