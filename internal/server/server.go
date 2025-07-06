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

	mux.Handle("/chat/", chatHandler)
	mux.Handle("/", spaHandler)

	return &http.Server{
		Addr:    *addr,
		Handler: mux,
	}
}
