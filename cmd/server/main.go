package main

import (
	"flag"
	"log"

	"github.com/mpm1900/m2chat/internal/server"
)

func main() {
	flag.Parse()

	s := server.NewServer()
	log.Printf("running on %s", s.Addr)

	err := s.ListenAndServe()
	if err != nil {
		log.Fatal(err)
	}
}
