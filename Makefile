run-web:
	cd web && bun run dev

build-web:
	cd web && bun run build

run-server:
	go run cmd/server/main.go

build-server:
	go build cmd/server/main.go
