# Cargstore

App Store for Clawdbot Desktop - Install and manage applications via Flatpak with a clean, user-friendly interface.

## Features

- **One-click install** - Install apps from Flathub with a single click
- **Curated catalog** - Hand-picked apps organized by category
- **Persistent storage** - Apps survive container rebuilds (stored in `/clawdbot_home/apps`)
- **Clawdbot integration** - Voice/chat commands: "Install VS Code"
- **Update manager** - Check and install updates easily

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run electron:dev

# Build for Linux
npm run build:linux
```

## Architecture

```
┌─────────────────────────────────────────────┐
│  Electron Main Process                      │
│  ├── FlatpakManager (CLI wrapper)           │
│  ├── ClawdbotClient (WebSocket)             │
│  └── IPC Handlers                           │
├─────────────────────────────────────────────┤
│  React Renderer                             │
│  ├── Discover - Featured apps               │
│  ├── Search - Search & category filter      │
│  ├── Installed - Manage installed apps      │
│  ├── Updates - Check & apply updates        │
│  └── AppDetail - Single app view            │
└─────────────────────────────────────────────┘
```

## Integration with Clawdbot Desktop

This app is designed to run inside [clawdbot-desktop](https://github.com/machine-machine/clawdbot-desktop).

The Dockerfile downloads the release artifact:

```dockerfile
ARG CARGSTORE_VERSION=0.1.0
RUN curl -fsSL "https://github.com/machine-machine/cargstore/releases/download/v${CARGSTORE_VERSION}/cargstore-linux-x64.tar.gz" \
    | tar -xzf - -C /opt/cargstore
```

## Flatpak Storage

Apps are installed to `/clawdbot_home/apps/flatpak` which is a persistent Docker volume. This ensures:

1. Apps survive container rebuilds
2. User data persists across sessions
3. No re-downloads after updates to the desktop image

## Clawdbot Commands

When connected to Clawdbot Gateway, these commands are available:

- "Search for [app name]"
- "Install [app name]"
- "Uninstall [app name]"
- "Open [app name]"
- "List installed apps"
- "Check for updates"

## License

MIT
