package server

import (
	"flag"
	"net/http"

	"github.com/mpm1900/m2chat/internal/chat"
)

var addr = flag.String("addr", ":3005", "http service address")

func NewServer() *http.Server {
	mux := http.NewServeMux()

	chatHandler := chat.NewChatHandler()
	spaHandler := &SpaHandler{
		staticPath: "./web/dist",
		indexPath:  "/index.html",
	}

	mux.Handle("/", spaHandler)
	mux.Handle("/chat/", chatHandler)

	return &http.Server{
		Addr:    *addr,
		Handler: mux,
	}
}
