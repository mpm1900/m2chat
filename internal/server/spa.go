package server

import (
	"net/http"
	"os"
	"path/filepath"
)

type SpaHandler struct {
	staticPath string
	indexPath  string
}

func (sh *SpaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	path := filepath.Join(sh.staticPath, r.URL.Path)
	file, err := os.Stat(path)
	if os.IsNotExist(err) || file.IsDir() {
		http.ServeFile(w, r, filepath.Join(sh.staticPath, sh.indexPath))
		return
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	http.ServeFile(w, r, path)
}
