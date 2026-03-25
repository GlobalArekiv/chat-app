# VidyaX

VidyaX is an open source distributed WebRTC conferencing solution for secure peer-to-peer video calls.

This repository contains:

- A Go backend server (signaling, room management, optional SFU mode)
- A React + TypeScript frontend bundle
- Deployment assets for Docker and Kubernetes

## Highlights

- Peer-to-peer mesh networking mode
- Optional SFU networking mode for reduced upstream bandwidth usage
- Redis-backed shared state for multi-instance deployments
- Built-in static asset embedding in the Go binary
- Prometheus metrics endpoint with token protection

## Tech Stack

- Backend: Go (module path `github.com/peer-calls/peer-calls/v4`)
- WebRTC: `pion/webrtc`
- Frontend: React, Redux, TypeScript, Sass, Webpack
- Realtime transport: WebSocket
- Optional store: Redis

## Requirements

- Node.js 18.x
- npm 9+
- Go 1.21+

Optional:

- Docker (containerized runtime)
- Kubernetes + `kubectl` (cluster deployment)

## Quick Start (Development)

### Fastest way - Auto-configured SFU mode

**Windows:**
```bash
./start.bat
```

**macOS/Linux:**
```bash
./start.sh
```

This handles everything automatically:
- Installs dependencies
- Builds frontend assets
- Starts the server in SFU mode
- Opens http://localhost:3000

### Manual startup

Install dependencies:

```bash
npm install
go mod download
```

**Start in SFU mode (default, recommended for scalability):**
```bash
npm start
```

**Start in Mesh mode (P2P, lower latency):**
```bash
npm run start:mesh
```

**Development with auto-reload (watches frontend changes):**
```bash
npm run dev
```

Open:
- `http://localhost:3000`

### Configuration

The default configuration is in `config.yml` with SFU topology enabled. For custom settings, edit `config.yml`:

- `network.type`: Choose `sfu` or `mesh`
- `network.sfu.udp.port_min/port_max`: UDP port range for media
- `store.type`: Choose `memory` (development) or `redis` (production)
- `ice_servers`: Add custom STUN/TURN servers

Environment variables can override config file settings:
```bash
PEERCALLS_NETWORK_TYPE=sfu npm start
PEERCALLS_STORE_TYPE=redis npm start
```

See `.env.development` and `.env.production` for all available environment variables.

## Common Commands

### Quick startup

```bash
npm start              # Build and run with SFU (default)
npm run start:mesh     # Build and run with Mesh (P2P)
npm run dev            # Watch frontend & run SFU server
npm run dev:mesh       # Watch frontend & run Mesh server
```

### Frontend and app flow

```bash
npm run build          # production frontend assets (JS + CSS)
npm run build && npm run build:go  # frontend assets + Go binary
npm run js             # production JavaScript bundle
npm run js:watch       # watch and rebuild JavaScript
npm run css            # compile Sass to CSS
npm run css:watch      # watch and recompile Sass
```

### Go server build

```bash
npm run build:go       # uses Makefile target: build
npm run build:go:linux # cross-build Linux amd64 binary
```

### Backend only (Go server)

```bash
go run main.go                             # run backend in Mesh mode
PEERCALLS_NETWORK_TYPE=sfu go run main.go  # run backend in SFU mode
```

### Tests and checks

```bash
npm test               # Jest tests
npm run test:coverage  # Jest with coverage
npm run test:go        # Go tests
npm run lint           # ESLint
npm run ci             # lint + coverage + TS + frontend build
```

## Running Modes

By default, server networking mode is mesh.

Run in SFU mode:

```bash
PEERCALLS_NETWORK_TYPE=sfu go run main.go
```

Or use the provided npm script:

```bash
npm run start:sfu
```

## Configuration

Configuration can be provided using:

- Environment variables (prefixed with `PEERCALLS_`)
- YAML config file passed via CLI arguments

Use `server/config_example.yml` as a starting point.

Important environment variables:

- `PEERCALLS_BIND_HOST` (default `0.0.0.0`)
- `PEERCALLS_BIND_PORT` (default `3000`)
- `PEERCALLS_BASE_URL`
- `PEERCALLS_STORE_TYPE` (`memory` or `redis`)
- `PEERCALLS_NETWORK_TYPE` (`mesh` or `sfu`)
- `PEERCALLS_ICE_SERVER_URLS`
- `PEERCALLS_TLS_CERT` and `PEERCALLS_TLS_KEY` for HTTPS
- `PEERCALLS_PROMETHEUS_ACCESS_TOKEN`

## Multi-Instance Deployment (Redis)

For horizontally scaled deployments, enable Redis-backed storage and use the same Redis key prefix across all instances.

See:

- `docker-compose.yml`
- `deploy/redis-deployment.yaml`
- `deploy/redis-service.yaml`

## Docker

Build and run:

```bash
docker build -t peer-calls .
docker run --rm -it -p 3000:3000 peer-calls
```

Container listens on port `3000`.

## Kubernetes

Base manifests are in `deploy/` and can be applied using the root `kustomization.yaml`.

Example:

```bash
kubectl apply -k .
```

## Project Structure

- `main.go`: entrypoint, embedded resources, CLI bootstrap
- `server/`: backend implementation and tests
- `src/`: frontend source (React/TypeScript/Sass)
- `build/`: generated frontend assets embedded into the binary
- `deploy/`: Kubernetes manifests
- `scripts/`: utility scripts (for example env variable linting)

## Browser Notes

Friendship Call relies on modern WebRTC APIs. For remote device testing (non-localhost), enable TLS to allow camera and microphone access in browsers.

## Contributing

Please read:

- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`

## License

Apache 2.0. See `LICENSE`.