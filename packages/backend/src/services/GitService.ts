import { SimpleGit, simpleGit } from 'simple-git';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class GitService {
  private git: SimpleGit;
  private repoPath: string;
  private commitQueue: Array<{ title: string; body?: string; timestamp: number }> = [];
  private commitTimer: NodeJS.Timeout | null = null;
  private readonly COMMIT_DEBOUNCE_MS = 5000;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
    this.git = simpleGit(repoPath);
  }

  /**
   * Initialize a new repository from GitHub
   */
  async initializeRepo(githubRepoUrl: string, userEmail: string, userName: string): Promise<void> {
    try {
      // Clone the repository
      await simpleGit().clone(githubRepoUrl, this.repoPath);

      // Configure git user for commits
      await this.git.addConfig('user.email', userEmail);
      await this.git.addConfig('user.name', userName);

      console.log(`Repository initialized at ${this.repoPath}`);
    } catch (error) {
      console.error('Failed to initialize repository:', error);
      throw error;
    }
  }

  /**
   * Create or update a file in the repository
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      const fullPath = path.join(this.repoPath, filePath);
      const dir = path.dirname(fullPath);

      // Create directories if they don't exist
      await fs.mkdir(dir, { recursive: true });

      // Write the file
      await fs.writeFile(fullPath, content, 'utf-8');

      // Queue a commit
      this.queueCommit(`Create or update file: ${filePath}`);
    } catch (error) {
      console.error(`Failed to write file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Read a file from the repository
   */
  async readFile(filePath: string): Promise<string> {
    try {
      const fullPath = path.join(this.repoPath, filePath);
      return await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      console.error(`Failed to read file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Delete a file from the repository
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(this.repoPath, filePath);
      await fs.rm(fullPath, { recursive: false });

      // Queue a commit
      this.queueCommit(`Delete file: ${filePath}`);
    } catch (error) {
      console.error(`Failed to delete file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * List files in a directory
   */
  async listDirectory(dirPath: string = ''): Promise<Array<{ name: string; type: 'file' | 'directory' }>> {
    try {
      const fullPath = path.join(this.repoPath, dirPath);
      const entries = await fs.readdir(fullPath, { withFileTypes: true });

      return entries.map((entry) => ({
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
      }));
    } catch (error) {
      console.error(`Failed to list directory ${dirPath}:`, error);
      throw error;
    }
  }

  /**
   * Queue a commit with debouncing
   */
  private queueCommit(message: string): void {
    this.commitQueue.push({
      title: message,
      timestamp: Date.now(),
    });

    // Clear existing timer
    if (this.commitTimer) {
      clearTimeout(this.commitTimer);
    }

    // Set new timer for debounced commit
    this.commitTimer = setTimeout(() => {
      this.executeQueuedCommits().catch((error) => {
        console.error('Failed to execute queued commits:', error);
      });
    }, this.COMMIT_DEBOUNCE_MS);
  }

  /**
   * Execute all queued commits as a single commit
   */
  private async executeQueuedCommits(): Promise<void> {
    if (this.commitQueue.length === 0) {
      return;
    }

    try {
      // Combine all commit messages
      const commitMessages = this.commitQueue.map((c) => c.title).join('\n');
      const combinedMessage = `Batch update: ${new Date().toISOString()}\n\n${commitMessages}`;

      // Stage all changes
      await this.git.add('.');

      // Check if there are changes to commit
      const status = await this.git.status();
      if (status.files.length > 0) {
        // Pull before push to avoid conflicts
        await this.pullWithMerge();

        // Commit changes
        await this.git.commit(combinedMessage);

        // Push to remote
        await this.push();
      }

      // Clear the queue
      this.commitQueue = [];
      this.commitTimer = null;
    } catch (error) {
      console.error('Error executing queued commits:', error);
      throw error;
    }
  }

  /**
   * Force a commit now instead of waiting for debounce
   */
  async commitNow(): Promise<void> {
    if (this.commitTimer) {
      clearTimeout(this.commitTimer);
      this.commitTimer = null;
    }
    await this.executeQueuedCommits();
  }

  /**
   * Pull from remote with automatic merge strategy
   */
  private async pullWithMerge(): Promise<void> {
    try {
      // Fetch latest from remote
      await this.git.fetch();

      // Pull with auto-merge strategy (ours = keep local changes on conflict)
      await this.git.pull(['--strategy-option=ours']);
    } catch (error) {
      console.error('Error during pull operation:', error);
      throw error;
    }
  }

  /**
   * Push to remote
   */
  private async push(): Promise<void> {
    try {
      await this.git.push();
    } catch (error) {
      console.error('Error during push operation:', error);
      throw error;
    }
  }

  /**
   * Get current git status
   */
  async getStatus(): Promise<any> {
    try {
      return await this.git.status();
    } catch (error) {
      console.error('Error getting git status:', error);
      throw error;
    }
  }

  /**
   * Get commit history
   */
  async getLog(limit: number = 10): Promise<any> {
    try {
      return await this.git.log({ maxCount: limit });
    } catch (error) {
      console.error('Error getting git log:', error);
      throw error;
    }
  }
}
