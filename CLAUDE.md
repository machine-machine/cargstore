# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cargstore is an Electron-based app store for Clawdbot Desktop. It provides a GUI for discovering, installing, and managing Flatpak applications within the containerized desktop environment.

## Architecture

```
cargstore/
├── electron/               # Electron main process
│   ├── main.ts             # App entry, window management, IPC handlers
│   ├── preload.ts          # Context bridge for renderer
│   ├── flatpak.ts          # Flatpak CLI wrapper (install/uninstall/update)
│   └── clawdbot-client.ts  # WebSocket client to Clawdbot Gateway (future)
├── src/                    # React renderer (Vite + TypeScript)
│   ├── App.tsx             # Main app with routing
│   ├── pages/              # Discover, Search, Installed, Updates views
│   ├── components/         # AppCard, CategoryFilter, SearchBar, etc.
│   └── hooks/              # useFlatpak, useCatalog
├── catalog/                # Curated app definitions
│   └── apps.json           # App metadata (id, name, flatpakRef/bundleUrl)
├── assets/                 # App icons
├── web/                    # Landing page (separate nginx deployment)
└── dist/                   # Build output
```

## Build and Development

```bash
# Install dependencies
npm install

# Development (Vite dev server + Electron)
npm run dev

# Build for production
npm run build

# Package as distributable
npm run package

# Create tarball for clawdbot-desktop
npm run dist:tar
```

## App Catalog Format

The catalog at `catalog/apps.json` defines available apps:

```json
{
  "apps": [
    {
      "id": "org.videolan.VLC",           // Flatpak app ID
      "name": "VLC",                       // Display name
      "summary": "Media player",           // Short description
      "description": "Full description...",
      "category": "utilities",             // Category ID
      "icon": "vlc.png",                   // Icon in assets/
      "featured": false,                   // Show on Discover page
      "flatpakRef": "flathub:app/org.videolan.VLC/x86_64/stable",  // OR
      "bundleUrl": "https://example.com/app.flatpak",              // For non-Flathub
      "keywords": ["video", "audio"]       // Search keywords
    }
  ],
  "categories": [
    { "id": "development", "name": "Development", "icon": "code" },
    { "id": "agents", "name": "AI Agents", "icon": "bot" }
  ]
}
```

**Installation types:**
- `flatpakRef`: Standard Flathub apps (uses `flatpak install`)
- `bundleUrl`: Direct `.flatpak` bundle download (uses `flatpak install --bundle`)

## Key Files

| File | Purpose |
|------|---------|
| `electron/flatpak.ts` | Wraps flatpak CLI commands, handles progress events |
| `electron/main.ts` | IPC handlers for renderer communication |
| `catalog/apps.json` | Curated app catalog with metadata |
| `src/pages/Discover.tsx` | Featured apps and category browsing |
| `src/pages/Installed.tsx` | Manage installed apps |

## IPC API

The renderer communicates with main process via IPC:

```typescript
// From renderer (via window.api)
window.api.flatpak.listInstalled()           // Get installed apps
window.api.flatpak.install(appId)            // Install from Flathub
window.api.flatpak.installBundle(appId, url) // Install from bundle URL
window.api.flatpak.uninstall(appId)          // Remove app
window.api.flatpak.launch(appId)             // Run app
window.api.flatpak.checkUpdates()            // Check for updates
window.api.catalog.get()                     // Get app catalog
```

## Integration with clawdbot-desktop

Cargstore is bundled into clawdbot-desktop at `/opt/cargstore/`:

1. **Dockerfile** downloads release tarball from GitHub
2. **Desktop entry** created at `/usr/share/applications/cargstore.desktop`
3. **Plank dock** has launcher icon for quick access

### Flatpak Storage (Important)

Apps persist across container rebuilds via symlink:

```
/home/developer/.local/share/flatpak  ->  /clawdbot_home/flatpak (persistent volume)
```

This symlink is created by `clawdbot-desktop/scripts/entrypoint.sh`. Without it:
- Root user sees installed apps
- Developer user (XFCE session) sees nothing

### D-Bus Requirement

Electron apps in Flatpak need the D-Bus session bus. In clawdbot-desktop:

```bash
# Find session bus from XFCE
cat /proc/$(pgrep -f xfce4-session)/environ | tr '\0' '\n' | grep DBUS

# Must set before running
export DBUS_SESSION_BUS_ADDRESS="unix:abstract=/tmp/dbus-xxxxx"
```

## Release Process

```bash
# 1. Bump version in package.json
npm version patch  # or minor/major

# 2. Build and create tarball
npm run build
npm run dist:tar
# Creates: release/cargstore-X.X.X.tar.gz

# 3. Create GitHub release
gh release create vX.X.X release/cargstore-X.X.X.tar.gz --title "vX.X.X" --notes "Release notes"

# 4. Update clawdbot-desktop Dockerfile
# Change: ARG CARGSTORE_VERSION=X.X.X
```

## Debugging in Container

```bash
CONTAINER=$(docker ps -q --filter "name=clawdbot-desktop-worker")

# Check Cargstore installation
docker exec $CONTAINER ls -la /opt/cargstore/

# View catalog
docker exec $CONTAINER cat /opt/cargstore/resources/catalog/apps.json | jq '.apps[].name'

# Run Cargstore manually (need X display)
docker exec $CONTAINER su - developer -c "DISPLAY=:0 /opt/cargstore/cargstore --no-sandbox"

# Check flatpak status
docker exec $CONTAINER su - developer -c "flatpak list"
docker exec $CONTAINER su - developer -c "flatpak remote-list"
```

## Future Plans

- **Web API**: REST endpoints for remote app management
- **Clawdbot Integration**: Install apps via chat commands
- **Auto-updates**: Background update checks with notifications
- **App ratings**: Community ratings and reviews

## Related Repo

The container that runs Cargstore: `/home/hi/coolify-repos/clawdbot-desktop`
