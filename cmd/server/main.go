package main

import (
	"context"
	"errors"
	"flag"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/mpm1900/m2chat/internal/server"
)

func main() {
	flag.Parse()
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	s := server.NewServer()
	go run(s)

	<-ctx.Done()
	shutdown(s)
}

func run(s *server.Server) {
	log.Printf("running on %s", s.Addr)
	err := s.ListenAndServe()
	if err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}

func shutdown(s *server.Server) {
	log.Println("shutting down...")
	shudownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := s.Shutdown(shudownCtx); err != nil {
		log.Printf("error shutting down: %v", err)
		return
	}

	log.Println("server shutdown complete")
}
