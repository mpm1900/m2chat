package chat

type MessageType string
type Message struct {
	ID       ID          `json:"id"`
	RoomID   ID          `json:"roomID"`
	ClientID ID          `json:"clientID,omitempty"`
	UserID   ID          `json:"userID,omitempty"`
	UserName string      `json:"userName,omitempty"`
	Type     MessageType `json:"type"`
	To       []ID        `json:"to,omitempty"`
	Omit     []ID        `json:"omit,omitempty"`
	Refetch  []string    `json:"refetch,omitempty"`
	Text     string      `json:"text,omitempty"`
	Payload  any         `json:"payload,omitempty"`
}

const (
	System        MessageType = "system"
	SystemChat    MessageType = "system:chat"
	Connect       MessageType = "connect"
	Chat          MessageType = "chat"
	DirectMessage MessageType = "direct_message"
)
