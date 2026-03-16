# Setup Guide for Windows Clone

## Prerequisites

- Node.js 18+ with npm
- Git
- GitHub account for OAuth

## 1. Create GitHub OAuth Application

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Windows Clone (or your preferred name)
   - **Homepage URL**: `http://localhost:5173` (for development)
   - **Authorization callback URL**: `http://localhost:5173/auth/callback`
4. Create the app and note your:
   - Client ID
   - Client Secret

## 2. Clone the Repository

```bash
git clone <repository-url>
cd windows-clone
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Configure Environment Variables

### Backend Configuration

Create `packages/backend/.env`:

```env
NODE_ENV=development
PORT=3000
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
SESSION_SECRET=your_secure_random_string
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

### Frontend Configuration

Create `packages/frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

## 5. Run Development Servers

### Option A: Run Both Services

```bash
npm run dev
```

This starts:
- Frontend on http://localhost:5173
- Backend on http://localhost:3000

### Option B: Run Services Separately

**Terminal 1 - Backend:**
```bash
cd packages/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd packages/frontend
npm run dev
```

## 6. Access the Application

1. Open http://localhost:5173 in your browser
2. Click "Sign in with GitHub"
3. Authorize the application
4. You should see the desktop environment

## 7. First Time Setup

When you log in for the first time:
- A personal repository named `windows-clone-data` will be created in your GitHub account
- This repo will store all your files and application data
- Initial file structure will be created automatically

## Troubleshooting

### "Cannot find module" errors

Make sure you've installed all dependencies:
```bash
npm install
```

### GitHub OAuth not working

1. Verify your OAuth app credentials in `.env`
2. Check that your authorization callback URL matches: `http://localhost:5173/auth/callback`
3. Clear browser cookies and try again

### Port already in use

If port 3000 or 5173 is already in use:
- Change the port in the respective `.env` file
- Update the CORS_ORIGIN and API URLs accordingly

### Git operations failing

The backend needs write access to create and manage user repositories. Make sure:
- The `data/` directory exists and is writable
- Your GitHub token has appropriate permissions (for the GitHub token feature)

## Next Steps

1. Explore the desktop environment
2. Try creating files in the file explorer
3. Check your GitHub repo to see how data is being stored
4. Read the Architecture document for more details

## Development Notes

- Frontend uses Vite with HMR for instant reload
- Backend uses tsx with file watching
- All data is stored in your GitHub account
- WebSocket connection for real-time updates
