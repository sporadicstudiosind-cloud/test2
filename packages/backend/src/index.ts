import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { AuthService } from './services/AuthService.js';
import { GitService } from './services/GitService.js';
import { FileService } from './services/FileService.js';
import { User } from './types/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Type augmentation for session
declare module 'express-session' {
  interface SessionData {
    user?: User;
  }
}

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.static('public'));

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
    },
  }),
);

// Services
const authService = new AuthService(
  process.env.GITHUB_CLIENT_ID || '',
  process.env.GITHUB_CLIENT_SECRET || '',
  `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback`,
);

// Map to store user sessions with their services
const userSessions = new Map<string, { authService: AuthService; gitService: GitService; fileService: FileService }>();

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth routes
app.get('/auth/login', (req, res) => {
  const authUrl = authService.generateAuthUrl();
  res.redirect(authUrl);
});

app.get('/auth/callback', async (req, res) => {
  try {
    const code = req.query.code as string;

    if (!code) {
      return res.status(400).send('Missing authorization code');
    }

    // Exchange code for token
    const accessToken = await authService.exchangeCodeForToken(code);

    // Get user info
    const user = await authService.getUserInfo(accessToken);

    // Initialize user's repository
    const repoUrl = await authService.initializeUserRepo(user);

    // Store user in session
    req.session.user = user;

    // Create git service for user
    const userRepoPath = path.join(__dirname, '../../data', user.id);
    const gitService = new GitService(userRepoPath);
    const fileService = new FileService(gitService);

    userSessions.set(user.id, { authService, gitService, fileService });

    // Initialize the repository (clone if not exists)
    try {
      await gitService.initializeRepo(repoUrl, user.email, user.username);
    } catch (error) {
      console.error('Error initializing repo:', error);
      // Repo might already exist locally, continue
    }

    // Redirect to frontend
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
  } catch (error) {
    console.error('Error in auth callback:', error);
    res.status(500).send('Authentication failed');
  }
});

// Check auth status
app.get('/auth/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ authenticated: false });
  }

  res.json({
    authenticated: true,
    user: {
      id: req.session.user.id,
      username: req.session.user.username,
      email: req.session.user.email,
      avatarUrl: req.session.user.avatarUrl,
    },
  });
});

// Logout
app.post('/auth/logout', (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

// File routes
app.post('/api/files/create', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { path: filePath, content } = req.body;
    const userSession = userSessions.get(req.session.user.id);

    if (!userSession) {
      return res.status(500).json({ error: 'User session not found' });
    }

    const file = await userSession.fileService.createFile(filePath, content || '');
    res.json(file);
  } catch (error) {
    console.error('Error creating file:', error);
    res.status(500).json({ error: 'Failed to create file' });
  }
});

app.get('/api/files/read', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const filePath = req.query.path as string;
    const userSession = userSessions.get(req.session.user.id);

    if (!userSession) {
      return res.status(500).json({ error: 'User session not found' });
    }

    const file = await userSession.fileService.readFile(filePath);
    res.json(file);
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

app.post('/api/files/delete', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { path: filePath } = req.body;
    const userSession = userSessions.get(req.session.user.id);

    if (!userSession) {
      return res.status(500).json({ error: 'User session not found' });
    }

    await userSession.fileService.deleteFile(filePath);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

app.get('/api/files/list', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const dirPath = (req.query.path as string) || '';
    const userSession = userSessions.get(req.session.user.id);

    if (!userSession) {
      return res.status(500).json({ error: 'User session not found' });
    }

    const files = await userSession.fileService.listDirectory(dirPath);
    res.json({ files });
  } catch (error) {
    console.error('Error listing directory:', error);
    res.status(500).json({ error: 'Failed to list directory' });
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Example event: file changed
  socket.on('file:changed', (data) => {
    io.emit('file:updated', data);
  });

  // Example event: window changed
  socket.on('window:changed', (data) => {
    io.emit('window:updated', data);
  });
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = parseInt(process.env.PORT || '3000', 10);
server.listen(PORT, () => {
  console.log(`Windows Clone backend running on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});
