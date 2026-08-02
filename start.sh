#!/bin/bash
# Serve the site locally. Usage: ./start.sh [port]
cd "$(dirname "$0")" || exit 1
PORT="${1:-4173}"
echo "Kilimanjaro site → http://127.0.0.1:$PORT"
echo "Ctrl-C to stop."
python3 -m http.server "$PORT" --bind 127.0.0.1
