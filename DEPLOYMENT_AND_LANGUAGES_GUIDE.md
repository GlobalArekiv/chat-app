# VidyaX: Languages & Deployment Complexity Analysis

## Executive Summary

**VidyaX** is a distributed WebRTC video conferencing solution with a **multi-language architecture**. The project uses **5 primary languages** with varying deployment complexities ranging from simple to advanced.

---

## 🔤 Languages Used in VidyaX

### 1. **Go (Backend Server)**
- **Version Required**: Go 1.21+
- **Purpose**: 
  - Backend signaling server
  - WebSocket communication handler
  - Room and peer management
  - Selective Forwarding Unit (SFU) implementation
  - Optional Redis adapter for distributed deployments
  - Prometheus metrics collection
  
- **Key Files/Directories**:
  - `main.go` - Application entry point
  - `server/` - Core server logic
  - `go.mod` & `go.sum` - Dependency management
  - `Makefile` - Build automation

- **Complexity**: **Advanced**
  - Concurrent WebRTC streams handling
  - ICE authentication and STUN/TURN server management
  - Goroutine orchestration for real-time media
  - Multiple adapter patterns (Redis, In-Memory, File System)

---

### 2. **TypeScript (Frontend Application)**
- **Version Required**: Node.js 18.x+, npm 9+
- **Purpose**:
  - React-based UI for video conferencing
  - Real-time peer connection management
  - State management with Redux
  - Type-safe frontend development
  
- **Key Files/Directories**:
  - `src/` - TypeScript/React source code
  - `tsconfig.json` - TypeScript configuration
  - `lib/` - Compiled JavaScript output
  
- **Complexity**: **Intermediate**
  - React component lifecycle management
  - Redux state synchronization
  - WebRTC peer connection lifecycle
  - Complex event handling for call setup/teardown

---

### 3. **Sass/SCSS (Styling)**
- **Purpose**:
  - Styling for the React frontend
  - CSS variable management
  - Responsive design implementation
  
- **Key Files**:
  - `src/sass/style.sass` - Main stylesheet
  - `build/style.css` - Compiled output
  
- **Complexity**: **Low**
  - Mainly presentational language
  - Build-time compilation required

---

### 4. **YAML (Configuration & Deployment)**
- **Purpose**:
  - Application configuration (`config.yml`)
  - Docker Compose configuration
  - Kubernetes deployment manifests
  - Service definitions
  
- **Key Files**:
  - `config.yml` - SFU/Mesh mode configuration
  - `docker-compose.yml` - Local containerized setup
  - `deploy/deployment.yaml` - K8s deployment
  - `deploy/service.yaml` - K8s service routing
  - `kustomization.yaml` - K8s customization
  - `transport-node-1.yml`, `transport-node-2.yml` - Multi-node setup
  
- **Complexity**: **Intermediate**
  - Requires understanding of indentation sensitivity
  - Multiple environment-specific configurations needed
  - Kubernetes-specific syntax for advanced deployments

---

### 5. **Dockerfile/Docker (Containerization)**
- **Purpose**:
  - Multi-stage build for optimized container images
  - Frontend asset compilation in container
  - Go binary compilation with minimal footprint
  - Production deployment image creation
  
- **Key Features**:
  - **Stage 1**: Node.js 18 Alpine - builds frontend assets
  - **Stage 2**: Go 1.19 Alpine - compiles backend server
  - **Stage 3**: Scratch image - minimal final container (~50MB)
  
- **Complexity**: **Intermediate**
  - Multi-stage builds require proper dependency management
  - Alpine Linux compatibility issues possible
  - Version mismatches between stages can break builds

---

### 6. **JavaScript (Build & Tooling)**
- **Purpose**:
  - Webpack configuration (bundling)
  - Jest testing framework
  - NPM script orchestration
  - Development tooling
  
- **Key Files**:
  - `webpack.common.js` - Shared webpack config
  - `webpack.dev.js` - Development optimizations
  - `webpack.prod.js` - Production optimizations
  - `jest.config.js` - Testing configuration
  - `jest.setup.js` - Test environment setup
  
- **Complexity**: **Intermediate**
  - Webpack dependency graph management
  - Asset optimization and minification
  - Source map generation for debugging

---

## 🚀 Deployment Architecture & Difficulties

### **Deployment Options**

#### 1. **Local Development** ✅ Easy
```bash
./start.bat (Windows) or ./start.sh (Linux/Mac)
```
**Single Command Setup**
- Auto-installs dependencies
- Auto-builds frontend
- Launches server in SFU mode
- Opens browser to localhost:3000

**Difficulty Level**: ⭐ Very Easy
- No external dependencies
- All-in-one automation script

---

#### 2. **Docker (Single Container)** ⚠️ Moderate
**File**: `Dockerfile` + `docker-compose.yml`

**Process**:
1. Node.js stage: `npm install` → Webpack build → Sass compilation
2. Go stage: `go mod download` → Static assets embed → Binary compile
3. Scratch stage: Final optimized image

**Key Difficulties**:
- **Alpine Linux compatibility**: Missing libc, curl, or other utilities
- **Network timeouts**: Large npm/Go dependency downloads
- **Build layer caching**: Can be slow on first build (~5-10 minutes)
- **Version mismatches**: Node 18.13 + Go 1.19.5 specific requirements
- **Redis dependency**: Must be running separately if store.type=redis

**Difficulty Level**: ⭐⭐ Moderate
- Requires Docker desktop installed
- Multi-stage build complexity
- Dependency timing issues possible

---

#### 3. **Kubernetes (Cloud/Multi-Instance)** ⚠️⚠️ Advanced
**Files**: 
- `deploy/deployment.yaml`
- `deploy/service.yaml`
- `deploy/redis-deployment.yaml`
- `deploy/configmap.yaml`
- `deploy/service-account.yaml`
- `kustomization.yaml`

**Components**:
1. **Peercalls Deployment** (2+ replicas)
   - Rolling updates with 0 downtime
   - Resource limits: CPU 100m-1000m, Memory 128Mi-1Gi
   - Health probes (liveness + readiness)
   - Security context: Non-root user (UID 1000)

2. **Kubernetes ConfigMap**
   - Mounts `config.yml` for dynamic configuration
   - Allows config changes without redeployment

3. **Redis StatefulSet** (for production store)
   - Separate from app pods
   - Requires persistent storage
   - Must handle replication

4. **Service Routing**
   - HTTP traffic on port 3000
   - Load balancing across 2+ replicas
   - Optional ingress configuration

**Key Difficulties**:
- **Image Registry**: Must push to `ghcr.io/peer-calls/peer-calls`
- **Cluster Configuration**: Requires active K8s cluster (`kubectl` context)
- **Storage Provisioning**: Redis needs PersistentVolume for production
- **Network Policy**: Pod-to-pod communication, ingress routing
- **Resource Tuning**: CPU/Memory limits based on load testing
- **Secrets Management**: API tokens, TLS certificates (not in base config)
- **DNS Resolution**: Internal K8s DNS for redis service discovery
- **Rolling Updates**: Must maintain session state across pod restarts

**Difficulty Level**: ⭐⭐⭐ Advanced
- Requires K8s cluster (Minikube, EKS, AKS, GKE)
- OPS knowledge needed for monitoring/logging
- Complex troubleshooting with distributed pods

---

#### 4. **Multi-Node Transport** ⚠️⚠️⚠️ Expert
**Files**:
- `transport-node-1.yml`
- `transport-node-2.yml`

**Purpose**: Distributed SFU setup across multiple machines

**Key Difficulties**:
- **Network Configuration**: Complex inter-node messaging
- **UDP Port Management**: Ranges (9000-9100) must not conflict
- **State Synchronization**: Requires Redis for shared state
- **Load Balancing**: Session affinity needed for media streams
- **Failover Logic**: Handling node crashes mid-call
- **Monitoring**: Distributed tracing/metrics across nodes

**Difficulty Level**: ⭐⭐⭐⭐ Expert Level
- Requires deep understanding of WebRTC media routing
- Production SRE knowledge necessary
- Complex orchestration required

---

## 📊 Deployment Difficulty Matrix

| Deployment Method | Complexity | Time to Deploy | External Dependencies | Failure Points |
|---|---|---|---|---|
| **Local Dev** | Easy ⭐ | 2-5 min | Node.js, Go | Build cache |
| **Docker** | Moderate ⭐⭐ | 10-15 min | Docker Desktop | Network timeouts, Alpine issues |
| **Kubernetes** | Advanced ⭐⭐⭐ | 30-45 min | K8s cluster, kubectl, Registry | Image pull, storage, DNS |
| **Multi-Node SFU** | Expert ⭐⭐⭐⭐ | 1+ hours | K8s, Redis cluster, Load balancer | Network partitions, state sync |

---

## 🔴 Top 5 Deployment Challenges

### **Challenge 1: Multi-Language Build Coordination**
**Issue**: Frontend must build BEFORE backend can embed assets
**Impact**: Build failures if Webpack/Sass fail silently
**Solution**: Use `npm run build` separately before `go build`

### **Challenge 2: Dependency Version Conflicts**
**Issue**: Node 18.13, Go 1.19.5, Alpine 3.x versions are tightly coupled
**Impact**: "command not found", linking errors in Docker build
**Solution**: Use exact versions in Dockerfile, test locally first

### **Challenge 3: Network Configuration (SFU Mode)**
**Issue**: UDP ports 9000-9100, TCP port 3001 must be open/exposed
**Impact**: Media streams fail if ports blocked by firewall/NAT
**Solution**: Configure firewall rules, use TURN servers for NAT traversal

### **Challenge 4: Redis Integration in Production**
**Issue**: Default memory store unsuitable for multi-instance; Redis setup adds complexity
**Impact**: Session loss on pod restart, race conditions
**Solution**: Run Redis StatefulSet with persistent storage, monitor connection pool

### **Challenge 5: WebRTC Connectivity (ICE Candidates)**
**Issue**: STUN/TURN servers needed for NAT traversal; default Google STUN may timeout
**Impact**: Calls fail in restrictive networks
**Solution**: Configure custom STUN/TURN servers in config.yml

---

## ✅ Pre-Deployment Checklist

### **Before Local Dev**
- [ ] Node.js 18.x installed
- [ ] Go 1.21+ installed
- [ ] npm 9+ installed
- [ ] `go mod download` completes
- [ ] `npm install` completes

### **Before Docker Deploy**
- [ ] Docker Desktop running
- [ ] Check `docker images` for space
- [ ] Test build: `docker build .`
- [ ] Verify ports are available: `docker ps`
- [ ] Redis running (if needed): `docker-compose up redis`

### **Before Kubernetes Deploy**
- [ ] `kubectl cluster-info` shows active context
- [ ] RBAC configured for service account
- [ ] Image pushed to registry (ghcr.io/peer-calls/peer-calls:latest)
- [ ] PersistentVolume available for Redis
- [ ] Network policies allow port 3000, 3001
- [ ] ConfigMap created with config.yml

### **Before Production (Multi-Node SFU)**
- [ ] Redis cluster deployed with replication
- [ ] Load balancer configured with session affinity
- [ ] Monitoring stack in place (Prometheus + Grafana)
- [ ] Logs aggregated (ELK, Loki, etc.)
- [ ] Disaster recovery plan documented
- [ ] Backup/restore process tested

---

## 🛠️ Build Pipeline Overview

```
┌─────────────────────────────────────────┐
│  Source Code (TypeScript, Go, Sass)     │
└────────────────┬────────────────────────┘
                 │
      ┌──────────┴──────────┐
      ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│  Webpack        │  │  Sass Compiler   │
│  TypeScript →   │  │  (style.sass →   │
│  JavaScript +   │  │   style.css)     │
│  Assets Bundle  │  └──────────────────┘
└────────┬─────────┘
         │
         └──────────────┬─────────────────┐
                        ▼                 ▼
                   ┌─────────────┐  ┌──────────────┐
                   │  build/     │  │  Embed into  │
                   │  index.js   │  │  Go Binary   │
                   │  style.css  │  └──────┬───────┘
                   └─────────────┘         │
                                           ▼
                                    ┌───────────────┐
                                    │  peer-calls   │
                                    │  (Go binary)  │
                                    └───────┬───────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    ▼                       ▼                       ▼
            ┌────────────────┐      ┌────────────────┐      ┌────────────────┐
            │  Local Dev     │      │  Docker Image  │      │  K8s Pod       │
            │  (./start.sh)  │      │  (multi-stage) │      │  (Deployment)  │
            └────────────────┘      └────────────────┘      └────────────────┘
```

---

## Language Statistics

| Language | Files | Purpose | Difficulty |
|---|---|---|---|
| **Go** | ~50+ | Backend server, signaling, SFU | Advanced |
| **TypeScript** | ~30+ | React frontend, UIcomponents | Intermediate |
| **JavaScript** | ~10+ | Webpack, Jest, build tools | Intermediate |
| **Sass/CSS** | ~5+ | Styling, responsive design | Low |
| **YAML** | ~6+ | Config, Docker, Kubernetes | Intermediate |
| **Dockerfile** | 1 | Container builds | Intermediate |

---

## Recommended Deployment Path

1. **Start**: Local development (`./start.sh`)
2. **Test**: Docker Compose (`docker-compose up`)
3. **Staging**: Kubernetes on Minikube/Kind
4. **Production**: Kubernetes on managed cluster (EKS/AKS/GKE)
5. **Scale**: Multi-node SFU with Redis cluster

---

## Configuration Precedence

### Environment Variables > config.yml Defaults

Example:
```bash
# Override config.yml with env vars
PEERCALLS_NETWORK_TYPE=mesh npm start         # Use P2P instead of SFU
PEERCALLS_STORE_TYPE=redis npm start          # Use Redis instead of memory
PEERCALLS_LOG_LEVEL=debug npm start           # Debug logging
```

All available env vars documented in `.env.development` and `.env.production`

---

## Troubleshooting Quick Reference

| Problem | Root Cause | Solution |
|---|---|---|
| `npm install` fails | Network timeout or npm cache | `npm cache clean --force` |
| `go mod download` fails | Proxy/corporate network | Configure Go proxy in env |
| Webpack build fails | TypeScript compilation error | Run `npm run ts` to see errors |
| Docker build fails on Alpine | Missing libc dependencies | Use ubuntu base instead of alpine |
| Kubernetes pod crash | Redis unreachable | Verify redis service DNS |
| WebRTC connection fails | Firewall blocking UDP 9000-9100 | Open ports or use TURN server |
| Performance issues | Single SFU node bottleneck | Split to multi-node SFU |

---

## Summary

**VidyaX** is a sophisticated **full-stack WebRTC application** requiring expertise across **5 languages** (Go, TypeScript, JavaScript, Sass, YAML). Deployment complexity ranges from **trivial** (local dev) to **expert-level** (distributed SFU cluster). Success requires careful attention to **version compatibility**, **network configuration**, and **orchestration automation**.

**Easiest Path**: Use Docker Compose  
**Most Scalable**: Kubernetes with Redis cluster  
**Production Recommended**: Multi-node SFU on managed K8s cluster

