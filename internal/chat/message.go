package chat

import (
	"encoding/json"
	"errors"
)

type Message struct {
	ID       uint32      `json:"id"`
	Type     MessageType `json:"type"`
	ClientID uint32      `json:"clientId"`
	RoomID   uint32      `json:"roomId"`
	To       uint32      `json:"to,omitempty"`
}

type MessageType uint8

const (
	System MessageType = iota
	Refetch
	Chat
	DirectMessage
)

func (mt MessageType) String() string {
	switch mt {
	case System:
		return "system"
	case Refetch:
		return "refetch"
	case Chat:
		return "chat"
	case DirectMessage:
		return "direct_message"
	default:
		return ""
	}
}

func ParseMessageType(s string) (MessageType, error) {
	switch s {
	case "system":
		return System, nil
	case "refetch":
		return Refetch, nil
	case "chat":
		return Chat, nil
	case "direct_message":
		return DirectMessage, nil
	default:
		return 0, errors.New("undefined MessageType")
	}
}

func (mt MessageType) MarshalJSON() ([]byte, error) {
	return json.Marshal(mt.String())
}

func (mt *MessageType) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}
	t, err := ParseMessageType(s)
	if err != nil {
		return err
	}
	*mt = t
	return nil
}
