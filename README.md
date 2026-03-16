# Windows Clone - React-Powered Desktop Environment

A feature-rich Windows-like desktop environment running entirely in the browser, with persistent GitHub-backed storage and support for multiple app types.

## Features

- 🖥️ **Desktop Environment**: Full Windows-like UI with taskbar, start menu, and window management
- 📁 **File System**: Complete file browser with create, read, update, delete operations
- 💾 **GitHub Persistence**: All data automatically synced to personal GitHub repository
- 🌐 **Web Browser**: Server-proxied browser for safe web access
- 🎮 **Multi-App Support**: Run React apps, desktop apps, and Android APKs
- 🔐 **GitHub Authentication**: Secure OAuth login with GitHub
- 🔄 **Real-time Sync**: WebSocket-based real-time updates

## Project Structure

```
windows-clone/
├── packages/
│   ├── frontend/          # React SPA
│   ├── backend/           # Express server
│   └── app-runtime/       # App execution engine
├── docker/                # Docker configuration
└── docs/                  # Documentation
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- GitHub OAuth App credentials

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd windows-clone
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:

**Backend** (`packages/backend/.env`):
```
NODE_ENV=development
PORT=3000
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
SESSION_SECRET=your_secret_key
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`packages/frontend/.env`):
```
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

4. Start development servers:
```bash
npm run dev
```

This starts:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Architecture

### Technology Stack

- **Frontend**: React 18 + TypeScript + Vite + Zustand + Socket.io
- **Backend**: Express.js + Socket.io + simple-git + Octokit
- **Storage**: GitHub Repository (direct git operations)
- **Real-time**: WebSocket (Socket.io)

### Key Services

- **GitService**: Handles all Git operations (clone, commit, push, pull)
- **AuthService**: GitHub OAuth authentication and user management
- **FileService**: File CRUD operations with security validation
- **BrowserService**: HTTP proxy for web browsing (coming soon)

## Development Roadmap

### Phase 1: Foundation ✅
- [x] Monorepo setup with TypeScript
- [x] Backend with Express + Socket.io
- [x] GitHub OAuth authentication
- [x] File system API
- [x] Desktop UI with window management
- [ ] Real-time synchronization

### Phase 2: File System & Apps
- [ ] File explorer with full navigation
- [ ] App manifest system
- [ ] App installation and execution

### Phase 3: Web Browser
- [ ] HTTP proxy server
- [ ] Browser window component
- [ ] URL navigation and history

### Phase 4: App Runtime
- [ ] React app container
- [ ] Android APK support
- [ ] App-to-app communication

## API Endpoints

### Authentication
- `GET /auth/login` - Initiate GitHub OAuth
- `GET /auth/callback` - OAuth callback
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout

### Files
- `POST /api/files/create` - Create file
- `GET /api/files/read` - Read file
- `POST /api/files/delete` - Delete file
- `GET /api/files/list` - List directory

### WebSocket Events
- `file:changed` - File change notification
- `window:changed` - Window state change
- `app:started` - App startup notification

## Security

- GitHub OAuth with PKCE
- JWT tokens for API authentication
- HTTP-only secure cookies
- Content Security Policy headers
- Input validation and sanitization
- App sandboxing

## Contributing

Contributions welcome! Please follow the existing code style and include tests for new features.

## License

MIT

## Support

For issues and feature requests, please open an issue on GitHub.
