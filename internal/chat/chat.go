package chat

import (
	"net/http"
)

type ChatHandler struct {
	Name string
	mux  *http.ServeMux
}

func (cs *ChatHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	cs.mux.ServeHTTP(w, r)
}

func NewChatHandler(mux *http.ServeMux) *ChatHandler {
	return &ChatHandler{
		Name: "chat",
		mux:  mux,
	}
}
