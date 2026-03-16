import { GitHubConfig, FileNode } from '../types';

const GH_API = 'https://api.github.com';

// ──────────────────────────────────────────
// Low-level fetch helper
// ──────────────────────────────────────────
async function ghFetch(
  config: GitHubConfig,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${GH_API}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  return res;
}

// ──────────────────────────────────────────
// User
// ──────────────────────────────────────────
export async function getAuthenticatedUser(token: string) {
  const res = await fetch(`${GH_API}/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (!res.ok) throw new Error('Invalid token or GitHub API error');
  return res.json();
}

// ──────────────────────────────────────────
// Repo
// ──────────────────────────────────────────
export async function getRepo(config: GitHubConfig) {
  const res = await ghFetch(config, `/repos/${config.owner}/${config.repo}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to get repo');
  return res.json();
}

export async function createRepo(token: string, name: string, description = 'OS Data Repository') {
  const res = await fetch(`${GH_API}/user/repos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, description, private: true, auto_init: true }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to create repo');
  }
  return res.json();
}

// ──────────────────────────────────────────
// Contents API helpers
// ──────────────────────────────────────────
function encode(content: string): string {
  return btoa(unescape(encodeURIComponent(content)));
}

function decode(b64: string): string {
  return decodeURIComponent(escape(atob(b64.replace(/\n/g, ''))));
}

export async function listContents(config: GitHubConfig, path: string): Promise<FileNode[]> {
  const res = await ghFetch(
    config,
    `/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(path)}?ref=${config.branch}`
  );
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Failed to list ${path}`);
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data
    .filter((item: any) => item.name !== '.gitkeep')
    .map((item: any) => ({
      path: item.path,
      name: item.name,
      type: item.type === 'dir' ? 'directory' : 'file',
      size: item.size,
      sha: item.sha,
    }));
}

export async function readFile(config: GitHubConfig, path: string): Promise<{ content: string; sha: string }> {
  const res = await ghFetch(
    config,
    `/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(path)}?ref=${config.branch}`
  );
  if (!res.ok) throw new Error(`Failed to read ${path}`);
  const data = await res.json();
  return { content: decode(data.content), sha: data.sha };
}

export async function writeFile(
  config: GitHubConfig,
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<string> {
  const body: Record<string, string> = {
    message,
    content: encode(content),
    branch: config.branch,
  };
  if (sha) body.sha = sha;

  const res = await ghFetch(config, `/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(path)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || `Failed to write ${path}`);
  }
  const data = await res.json();
  return data.content.sha;
}

export async function deleteFile(
  config: GitHubConfig,
  path: string,
  sha: string,
  message: string
): Promise<void> {
  const res = await ghFetch(config, `/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(path)}`, {
    method: 'DELETE',
    body: JSON.stringify({ message, sha, branch: config.branch }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || `Failed to delete ${path}`);
  }
}

// Get SHA of a file (needed for update/delete)
export async function getFileSha(config: GitHubConfig, path: string): Promise<string | null> {
  const res = await ghFetch(
    config,
    `/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(path)}?ref=${config.branch}`
  );
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const data = await res.json();
  return data.sha || null;
}

// ──────────────────────────────────────────
// OS Data Initialization
// ──────────────────────────────────────────
export const OS_DATA_ROOT = '.osdata';
export const FS_ROOT = `${OS_DATA_ROOT}/fs`;

const INITIAL_DIRS = [
  `${FS_ROOT}/Desktop`,
  `${FS_ROOT}/Documents`,
  `${FS_ROOT}/Downloads`,
  `${FS_ROOT}/Pictures`,
  `${FS_ROOT}/Apps`,
];

export async function initializeOsData(config: GitHubConfig): Promise<void> {
  // Check if already initialized
  const sha = await getFileSha(config, `${OS_DATA_ROOT}/settings.json`);
  if (sha) return; // already initialized

  // Create initial directories (gitkeep files)
  for (const dir of INITIAL_DIRS) {
    await writeFile(config, `${dir}/.gitkeep`, '', `init: create ${dir}`).catch(() => {});
  }

  // Create settings.json
  const defaultSettings = {
    theme: { mode: 'dark', accentColor: '#3b82f6' },
    wallpaper: 'gradient-blue',
    desktopIconSize: 'medium',
    taskbarPosition: 'bottom',
    showSeconds: true,
    desktopName: 'My Desktop',
  };
  await writeFile(config, `${OS_DATA_ROOT}/settings.json`, JSON.stringify(defaultSettings, null, 2), 'init: settings');

  // Create apps/installed.json
  await writeFile(config, `${OS_DATA_ROOT}/apps/installed.json`, '[]', 'init: app registry');

  // Create bookmarks.json
  const defaultBookmarks = [
    { id: '1', title: 'GitHub', url: 'https://github.com', createdAt: new Date().toISOString() },
    { id: '2', title: 'Google', url: 'https://google.com', createdAt: new Date().toISOString() },
  ];
  await writeFile(config, `${OS_DATA_ROOT}/bookmarks.json`, JSON.stringify(defaultBookmarks, null, 2), 'init: bookmarks');
}

// ──────────────────────────────────────────
// JSON helpers
// ──────────────────────────────────────────
export async function readJson<T>(config: GitHubConfig, path: string): Promise<T | null> {
  try {
    const { content } = await readFile(config, path);
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function writeJson<T>(
  config: GitHubConfig,
  path: string,
  data: T,
  message: string
): Promise<void> {
  const sha = await getFileSha(config, path);
  await writeFile(config, path, JSON.stringify(data, null, 2), message, sha || undefined);
}
