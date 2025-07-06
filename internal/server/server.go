package server

import (
	"flag"
	"net/http"

	"github.com/mpm1900/m2chat/internal/chat"
)

var addr = flag.String("addr", ":3005", "http service address")

func NewServer() *http.Server {
	fs := http.FileServer(http.Dir("./web/dist"))
	mux := http.NewServeMux()
	handler := chat.NewChatHandler(mux)
	server := &http.Server{
		Addr:    *addr,
		Handler: handler,
	}

	mux.Handle("/", fs)

	return server
}
