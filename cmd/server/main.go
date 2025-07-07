package main

import (
	"context"
	"flag"
	"log"
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
	go s.Run()

	<-ctx.Done()
	shutdown(s)
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
