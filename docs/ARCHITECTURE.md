# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     BROWSER (React Frontend)                     │
├─────────────────────────────────────────────────────────────────┤
│  Desktop  │  Taskbar  │  Start Menu  │  Window Manager  │ Tray  │
└────────────────────────┬──────────────────────────────────────────┘
                         │ REST API / WebSocket
                         │
┌─────────────────────────┴──────────────────────────────────────────┐
│                    EXPRESS BACKEND SERVER                          │
├─────────────────────────────────────────────────────────────────┬─┤
│ Auth Routes  │ File API  │  App Manager  │  Browser Proxy  │ WS │
├─────────────────────────────────────────────────────────────────┤
│                    GitHub Git Operations                         │
│  (simple-git: clone/pull/push + automatic commit/sync)         │
└─────────────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    ┌───▼─────┐    ┌─────▼──────┐   ┌────▼────┐
    │ GitHub  │    │  Octokit   │   │ Real Web│
    │ Repo    │    │   API      │   │(HTTP)   │
    └─────────┘    └────────────┘   └─────────┘
```

## Core Components

### Frontend Architecture

#### Pages
- **LoginPage**: GitHub OAuth entry point
- **DesktopPage**: Main desktop environment

#### Components
- **Desktop**: Wallpaper and desktop icons
- **Taskbar**: System tray and open windows
- **WindowContainer**: Draggable/resizable window wrapper
- **Apps**: File Explorer, Text Editor, Web Browser

#### State Management (Zustand Stores)
- **authStore**: User authentication and session
- **windowStore**: Window lifecycle and state
- **fileStore**: File system operations

#### Hooks
- **useSocket**: Socket.io connection and event handling
- **useRealtimeSync**: Real-time file and window synchronization

### Backend Architecture

#### Services
- **GitService**: Git operations (clone, commit, push, pull, merge)
- **AuthService**: GitHub OAuth and user management
- **FileService**: File CRUD with path validation
- **BrowserService** (coming): HTTP proxy for web browsing
- **AppService** (coming): App installation and execution

#### Routes
- `/auth/*`: Authentication endpoints
- `/api/files/*`: File system API
- `/api/apps/*`: App management (coming)
- `/api/browser/*`: Browser proxy (coming)

#### WebSocket Events
- `file:changed` → `file:updated`: File change notifications
- `window:changed` → `window:updated`: Window state updates
- `app:started`: App startup notifications

## Data Flow

### File Creation
```
1. User creates file via FileExplorer UI
2. Frontend: fileStore.createFile()
3. HTTP POST /api/files/create {path, content}
4. Backend: GitService.writeFile() → fs.writeFile()
5. GitService queues commit (debounced 5s)
6. After debounce: git add, commit, push
7. WebSocket: file:changed event sent to all clients
```

### Authentication Flow
```
1. User clicks "Sign in with GitHub"
2. Frontend redirects to /auth/login
3. Backend initiates GitHub OAuth
4. User authorizes app on GitHub
5. GitHub redirects to /auth/callback with code
6. Backend exchanges code for access token
7. Backend fetches user info via Octokit
8. Backend creates/initializes user repo
9. User stored in session
10. Frontend redirected to desktop
```

### Real-time Sync
```
1. User makes changes (files, windows)
2. Frontend emits event via Socket.io
3. Backend receives and broadcasts to other clients
4. Frontend listens and updates UI
5. Can sync across multiple browser tabs
```

## Data Storage

### GitHub Repository Structure
```
user-repo/
├── .claude/                    # System metadata
│   ├── app-registry.json      # Installed apps
│   └── settings.json          # User preferences
├── Desktop/                    # Desktop files & shortcuts
│   └── MyIcon.json
├── Files/                      # User data
│   ├── Documents/
│   ├── Downloads/
│   └── Pictures/
└── Programs/                   # Installed applications
    ├── app-1/
    │   └── app.manifest.json
    └── app-2/
        └── app.manifest.json
```

### Git Commit Strategy
- Event-driven commits with 5-second debounce
- Batches multiple changes into single commit
- Pull-before-push to avoid conflicts
- Last-write-wins conflict resolution
- All commits timestamped with ISO date

## Key Design Decisions

### Why GitHub as Database?
- ✅ Free and unlimited storage per user
- ✅ Built-in versioning and backup
- ✅ No additional backend database needed
- ✅ Easy access and audit trail
- ✅ Distributed across repos (one per user)

### Why REST + WebSocket Hybrid?
- ✅ REST for stateful operations (create, update, delete)
- ✅ WebSocket for real-time events and notifications
- ✅ Better separation of concerns
- ✅ Scales better than pure WebSocket
- ✅ Graceful degradation if WebSocket fails

### Why Server-Side Proxy for Browser?
- ✅ Solves CORS issues
- ✅ Enables request/response logging
- ✅ Allows content filtering
- ✅ No iframe sandbox limitations
- ✅ Custom memory/tab model

### Why Zustand for State Management?
- ✅ Minimal boilerplate
- ✅ Fast and lightweight
- ✅ No provider wrapper needed
- ✅ Great for local state (windows, UI)
- ✅ Easy to combine with external state (Socket.io)

## Security Architecture

### Authentication
- GitHub OAuth with PKCE
- JWT tokens for API (short-lived)
- HTTP-only secure cookies for sessions
- Token refresh on login

### Authorization
- Users can only access their own data
- Files outside user repo rejected
- Path traversal prevention (.., /)
- Input sanitization on filenames

### Data Protection
- All data versioned in Git
- GitHub handles encryption at rest/transit
- No sensitive data in commits
- Rate limiting on endpoints

## Scalability Considerations

### Current Limitations
- Single repository per user (scales to millions)
- Git operations may be slow with large repos (fix: split into sub-repos)
- WebSocket connections per server (fix: add Redis pub/sub)

### Future Improvements
- Add Redis for session/cache layer
- Split large repos into shards
- Implement CDN for static content
- Add rate limiting and caching headers
- Implement batch operations for bulk file changes

## Performance Optimization

### Frontend
- Code splitting with Vite
- Lazy loading of window components
- Memoization of Zustand selectors
- WebSocket message batching

### Backend
- Commit debouncing (5 seconds)
- Batch git operations
- File caching (in-memory)
- Connection pooling for Git

## Testing Strategy

### Unit Tests
- Service logic (Git, Auth, File operations)
- Store reducers and selectors
- Component rendering and interactions

### Integration Tests
- OAuth flow end-to-end
- File create → commit → retrieve cycle
- Window management state persistence

### E2E Tests
- User signup and login
- File operations through UI
- App installation and execution
- Multi-window interactions

## Deployment

### Development
```
npm run dev
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

### Production
- Frontend: Vercel (SPA)
- Backend: Railway or Cloud Run
- Database: GitHub
- DNS: Cloudflare

### Environment Variables
```
Backend:
- GITHUB_CLIENT_ID
- GITHUB_CLIENT_SECRET
- SESSION_SECRET

Frontend:
- VITE_API_URL
- VITE_WS_URL
```

## Future Architecture Enhancements

1. **Terminal**: Add bash shell with pseudo-filesystem
2. **Database**: Built-in SQLite or PostgreSQL
3. **APIs**: REST API for external app integration
4. **Themes**: Custom skins and dark mode
5. **Notifications**: Desktop-style notification system
6. **Mobile**: React Native companion app
7. **Offline**: Service Worker for offline mode
8. **Plugins**: Third-party extension system
