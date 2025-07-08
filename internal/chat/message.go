package chat

type MessageType string
type Message struct {
	ID       ID          `json:"id"`
	RoomID   ID          `json:"roomID"`
	ClientID ID          `json:"clientID,omitempty"`
	Type     MessageType `json:"type"`
	To       []ID        `json:"to,omitempty"`
	Omit     []ID        `json:"omit,omitempty"`
	Refetch  []string    `json:"refetch,omitempty"`
	Text     string      `json:"text,omitempty"`
	Payload  any         `json:"payload,omitempty"`
}

const (
	System        MessageType = "system"
	Connect       MessageType = "connect"
	Chat          MessageType = "chat"
	DirectMessage MessageType = "direct_message"
)
