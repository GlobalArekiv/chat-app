package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type RoomResponse struct {
	RoomID  string `json:"roomId"`
	RoomURL string `json:"roomUrl"`
}

type RoomStatusResponse struct {
	RoomID       string `json:"roomId"`
	Active       bool   `json:"active"`
	Participants int    `json:"participants"`
}

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

func apiHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func apiCreateRoom(w http.ResponseWriter, r *http.Request) {
	roomID := fmt.Sprintf("room-%d", time.Now().UnixNano()%100000)
	roomURL := fmt.Sprintf("https://academiqportal.com/%s", roomID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(RoomResponse{
		RoomID:  roomID,
		RoomURL: roomURL,
	})
}

func apiRoomStatus(w http.ResponseWriter, r *http.Request) {
	roomID := strings.TrimPrefix(r.URL.Path, "/api/rooms/")
	roomID = strings.TrimSuffix(roomID, "/status")

	// For now, return a mock response
	// In production, this would query the actual room state
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(RoomStatusResponse{
		RoomID:       roomID,
		Active:       true,
		Participants: 0,
	})
}
