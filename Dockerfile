FROM golang:alpine3.22 as builder

WORKDIR /app
COPY . .
RUN go mod download
COPY . .
RUN go build -o main cmd/server/main.go


EXPOSE 3005
CMD ["./main"]
