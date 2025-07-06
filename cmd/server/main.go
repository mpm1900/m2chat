package main

import (
	"flag"
	"log"

	"github.com/mpm1900/m2chat/internal/server"
)

func main() {
	flag.Parse()

	s := server.NewServer()
	err := s.ListenAndServe()
	if err != nil {
		log.Fatal(err)
	}
}
