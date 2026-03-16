import { GitService } from './GitService.js';
import { FileSystemNode } from '../types/index.js';
import path from 'path';

export class FileService {
  private gitService: GitService;

  constructor(gitService: GitService) {
    this.gitService = gitService;
  }

  /**
   * Create a new file
   */
  async createFile(filePath: string, content: string = ''): Promise<FileSystemNode> {
    // Normalize and validate path
    const normalizedPath = this.normalizePath(filePath);

    // Prevent directory traversal
    if (normalizedPath.includes('..')) {
      throw new Error('Invalid file path: directory traversal not allowed');
    }

    await this.gitService.writeFile(normalizedPath, content);

    return {
      path: normalizedPath,
      name: path.basename(normalizedPath),
      type: 'file',
      size: content.length,
      modifiedAt: Date.now(),
      content: content,
    };
  }

  /**
   * Read a file
   */
  async readFile(filePath: string): Promise<FileSystemNode> {
    const normalizedPath = this.normalizePath(filePath);

    if (normalizedPath.includes('..')) {
      throw new Error('Invalid file path: directory traversal not allowed');
    }

    const content = await this.gitService.readFile(normalizedPath);

    return {
      path: normalizedPath,
      name: path.basename(normalizedPath),
      type: 'file',
      size: content.length,
      modifiedAt: Date.now(),
      content: content,
    };
  }

  /**
   * Update a file
   */
  async updateFile(filePath: string, content: string): Promise<FileSystemNode> {
    return this.createFile(filePath, content);
  }

  /**
   * Delete a file
   */
  async deleteFile(filePath: string): Promise<void> {
    const normalizedPath = this.normalizePath(filePath);

    if (normalizedPath.includes('..')) {
      throw new Error('Invalid file path: directory traversal not allowed');
    }

    await this.gitService.deleteFile(normalizedPath);
  }

  /**
   * List directory contents
   */
  async listDirectory(dirPath: string = ''): Promise<FileSystemNode[]> {
    const normalizedPath = this.normalizePath(dirPath);

    if (normalizedPath.includes('..')) {
      throw new Error('Invalid directory path: directory traversal not allowed');
    }

    const entries = await this.gitService.listDirectory(normalizedPath);

    return entries.map((entry) => ({
      path: path.join(normalizedPath, entry.name),
      name: entry.name,
      type: entry.type,
      modifiedAt: Date.now(),
    }));
  }

  /**
   * Create a directory (by creating a .gitkeep file)
   */
  async createDirectory(dirPath: string): Promise<FileSystemNode> {
    const normalizedPath = this.normalizePath(dirPath);

    if (normalizedPath.includes('..')) {
      throw new Error('Invalid directory path: directory traversal not allowed');
    }

    // Create .gitkeep to ensure directory is tracked by git
    const gitKeepPath = `${normalizedPath}/.gitkeep`;
    await this.gitService.writeFile(gitKeepPath, '');

    return {
      path: normalizedPath,
      name: path.basename(normalizedPath),
      type: 'directory',
      modifiedAt: Date.now(),
    };
  }

  /**
   * Copy a file
   */
  async copyFile(sourcePath: string, destPath: string): Promise<FileSystemNode> {
    const source = this.normalizePath(sourcePath);
    const dest = this.normalizePath(destPath);

    if (source.includes('..') || dest.includes('..')) {
      throw new Error('Invalid path: directory traversal not allowed');
    }

    const content = await this.gitService.readFile(source);
    return this.createFile(dest, content);
  }

  /**
   * Move a file
   */
  async moveFile(sourcePath: string, destPath: string): Promise<FileSystemNode> {
    const source = this.normalizePath(sourcePath);
    const dest = this.normalizePath(destPath);

    if (source.includes('..') || dest.includes('..')) {
      throw new Error('Invalid path: directory traversal not allowed');
    }

    const content = await this.gitService.readFile(source);
    await this.gitService.deleteFile(source);
    return this.createFile(dest, content);
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const normalizedPath = this.normalizePath(filePath);
      await this.gitService.readFile(normalizedPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Normalize file path to prevent traversal attacks
   */
  private normalizePath(filePath: string): string {
    // Remove leading/trailing slashes
    let normalized = filePath.replace(/^\/+|\/+$/g, '');

    // Replace backslashes with forward slashes
    normalized = normalized.replace(/\\/g, '/');

    // Collapse multiple slashes
    normalized = normalized.replace(/\/+/g, '/');

    return normalized;
  }
}
