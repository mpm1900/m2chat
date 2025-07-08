package chat

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

const WriteWait = 10 * time.Second
const PongWait = 60 * time.Second
const PingPeriod = (PongWait * 9) / 10
const MaxMessageSize = 512

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

type Client struct {
	ID     ID                 `json:"id"`
	conn   *websocket.Conn    `json:"-"`
	room   *Room              `json:"-"`
	send   chan Message       `json:"-"`
	ctx    context.Context    `json:"-"`
	cancel context.CancelFunc `json:"-"`
}

func NewClient(room *Room) *Client {
	ctx, cancel := context.WithCancel(context.Background())

	return &Client{
		ID:     NewID(),
		send:   make(chan Message, 256),
		room:   room,
		ctx:    ctx,
		cancel: cancel,
	}
}

func (c *Client) readMessage(message *Message) error {
	_, raw, err := c.conn.ReadMessage()
	if err != nil {
		if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
			log.Printf("unexpected client error: %v", err)
		}
		return err
	}
	if err := json.Unmarshal(raw, message); err != nil {
		log.Printf("message format error: %v", err)
		return err
	}
	return nil
}

func (c *Client) writeMessage(message Message) error {
	jsonMessage, err := json.Marshal(message)
	if err != nil {
		log.Printf("message format error: %v", err)
		return err
	}

	if err := c.conn.WriteMessage(websocket.TextMessage, jsonMessage); err != nil {
		return err
	}
	return nil
}

func (c *Client) read() {
	defer func() {
		log.Printf("[client=%s] disconnected", c.ID)

		c.room.unregister <- c
		c.conn.Close()
		c.cancel()
	}()

	pongHandler := func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(PongWait))
		return nil
	}
	c.conn.SetReadLimit(MaxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(PongWait))
	c.conn.SetPongHandler(pongHandler)

	for {
		var message Message
		if err := c.readMessage(&message); err != nil {
			// if this error is an expected close error
			// or a message format error,
			//    then we can close the client
			break
		}

		message.ClientID = c.ID
		message.RoomID = c.room.ID
		log.Printf("[client=%s] received message: %v", c.ID, message)

		select {
		case c.room.incoming <- message:
		case <-c.ctx.Done():
			return
		}
	}
}

func (c *Client) write() {
	clock := time.NewTicker(PingPeriod)
	defer func() {
		clock.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message := <-c.send:
			if err := c.writeMessage(message); err != nil {
				return
			}
		// this block ensures that the client doesnt' get disconnected
		// automatically when the connection is idle
		case <-clock.C:
			c.conn.SetWriteDeadline(time.Now().Add(WriteWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		case <-c.ctx.Done():
			return
		}
	}
}

func (c *Client) Connect(w http.ResponseWriter, r *http.Request) error {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return err
	}

	log.Printf("[client=%s] connected", c.ID)
	c.conn = conn
	c.room.register <- c
	return nil
}

func (c *Client) Subscribe() {
	go c.read()
	go c.write()
}
