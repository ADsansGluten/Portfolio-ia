# Mr Ybot (WebAssembly)

`ybot.wasm.gz` (WebAssembly compressé en gzip, décompressé dans le navigateur) est le jeu **Projet RED – Mr Ybot** (équipe de 3, Ynov Sophia) compilé en WebAssembly pour tourner dans le navigateur.
Code source : https://github.com/ItsForTheVibes/Projet-Red-Mr-Ybot (commit 8dc92dc), aucune modification du code du jeu.

Recompiler :

    GOOS=js GOARCH=wasm go build -ldflags="-s -w" -o ybot.wasm . && gzip -9 ybot.wasm

`wasm_exec.js` vient de la distribution Go (lib/wasm/wasm_exec.js, Go 1.24, licence BSD).
