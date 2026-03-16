import { useEffect, useState, useCallback } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { useWindowStore } from '../../stores/windowStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useContextMenuStore } from '../../stores/contextMenuStore';
import { FileNode } from '../../types';
import {
  ChevronRight, ChevronLeft, Home, Folder, File, FileText, Image,
  Plus, FolderPlus, Trash2, RefreshCw, Edit3, FileCode,
} from 'lucide-react';

function getFileIcon(name: string, type: string) {
  if (type === 'directory') return null; // use Folder component
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return <Image size={15} className="text-green-400" />;
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'go', 'rs', 'java', 'cpp', 'c', 'cs'].includes(ext)) return <FileCode size={15} className="text-yellow-400" />;
  if (['md', 'txt', 'rst'].includes(ext)) return <FileText size={15} className="text-blue-400" />;
  return <File size={15} className="text-white/50" />;
}

interface Props {
  windowId?: string;
  appData?: Record<string, unknown>;
}

export function FileExplorer({ appData }: Props) {
  const { currentPath, files, isLoading, error, listFiles, writeFile, createFolder, deleteItem, renameItem, setError } = useFileStore();
  const { createWindow } = useWindowStore();
  const { add: notify } = useNotificationStore();
  const { open: openCtx } = useContextMenuStore();

  const [navInput, setNavInput] = useState('/');
  const [history, setHistory] = useState<string[]>(['/']);
  const [histIdx, setHistIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [newItemMode, setNewItemMode] = useState<'file' | 'folder' | null>(null);
  const [newItemName, setNewItemName] = useState('');

  useEffect(() => {
    const initialPath = (appData?.path as string) || '/';
    listFiles(initialPath);
    setNavInput(initialPath);
    setHistory([initialPath]);
  }, []);

  useEffect(() => {
    setNavInput(currentPath);
  }, [currentPath]);

  const navigate = useCallback((path: string) => {
    const newHistory = history.slice(0, histIdx + 1);
    newHistory.push(path);
    setHistory(newHistory);
    setHistIdx(newHistory.length - 1);
    listFiles(path);
    setSelected(null);
  }, [history, histIdx, listFiles]);

  const goBack = () => {
    if (histIdx > 0) {
      const newIdx = histIdx - 1;
      setHistIdx(newIdx);
      listFiles(history[newIdx]);
    }
  };

  const goForward = () => {
    if (histIdx < history.length - 1) {
      const newIdx = histIdx + 1;
      setHistIdx(newIdx);
      listFiles(history[newIdx]);
    }
  };

  const goUp = () => {
    const parts = currentPath.split('/').filter(Boolean);
    if (parts.length === 0) return;
    const parent = '/' + parts.slice(0, -1).join('/');
    navigate(parent || '/');
  };

  const handleFileOpen = (file: FileNode) => {
    if (file.type === 'directory') {
      navigate(file.path);
    } else {
      createWindow(`${file.name} — Text Editor`, 'text-editor', { filePath: file.path, fileName: file.name });
    }
  };

  const handleFileContextMenu = (e: React.MouseEvent, file: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected(file.path);
    openCtx(e.clientX, e.clientY, [
      {
        id: 'open', label: file.type === 'directory' ? 'Open Folder' : 'Open', icon: '📂',
        action: () => handleFileOpen(file),
      },
      ...(file.type === 'file' ? [{
        id: 'edit', label: 'Edit in Text Editor', icon: '📝',
        action: () => createWindow(`${file.name} — Text Editor`, 'text-editor', { filePath: file.path, fileName: file.name }),
      }] : []),
      { id: 'd1', label: '', divider: true, action: () => {} },
      {
        id: 'rename', label: 'Rename', icon: '✏️',
        action: () => { setRenaming(file.path); setRenameVal(file.name); },
      },
      {
        id: 'delete', label: 'Delete', icon: '🗑️',
        action: async () => {
          await deleteItem(file.path);
          notify('success', 'Deleted', `"${file.name}" was deleted.`);
        },
      },
    ]);
  };

  const handleDesktopContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openCtx(e.clientX, e.clientY, [
      { id: 'newfile', label: 'New File', icon: '📄', action: () => setNewItemMode('file') },
      { id: 'newfolder', label: 'New Folder', icon: '📁', action: () => setNewItemMode('folder') },
      { id: 'd1', label: '', divider: true, action: () => {} },
      { id: 'refresh', label: 'Refresh', icon: '🔄', action: () => listFiles(currentPath) },
    ]);
  };

  const handleCreateItem = async () => {
    if (!newItemName.trim()) { setNewItemMode(null); return; }
    const path = currentPath === '/' ? `/${newItemName}` : `${currentPath}/${newItemName}`;
    if (newItemMode === 'folder') {
      await createFolder(path);
      notify('success', 'Folder Created', path);
    } else {
      await writeFile(path, '');
      notify('success', 'File Created', path);
    }
    setNewItemMode(null);
    setNewItemName('');
  };

  const handleRename = async () => {
    if (!renaming || !renameVal.trim()) { setRenaming(null); return; }
    await renameItem(renaming, renameVal.trim());
    notify('success', 'Renamed', renameVal);
    setRenaming(null);
  };

  const breadcrumbs = currentPath.split('/').filter(Boolean);

  return (
    <div
      className="w-full h-full flex flex-col bg-gray-900 text-white select-none"
      onContextMenu={handleDesktopContextMenu}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-800/80 border-b border-white/5 shrink-0">
        <button onClick={goBack} disabled={histIdx === 0} className="p-1.5 hover:bg-white/10 rounded disabled:opacity-30 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <button onClick={goForward} disabled={histIdx >= history.length - 1} className="p-1.5 hover:bg-white/10 rounded disabled:opacity-30 transition-colors">
          <ChevronRight size={16} />
        </button>
        <button onClick={goUp} disabled={currentPath === '/'} className="p-1.5 hover:bg-white/10 rounded disabled:opacity-30 transition-colors">
          <ChevronLeft size={16} className="rotate-90" />
        </button>
        <button onClick={() => navigate('/')} className="p-1.5 hover:bg-white/10 rounded transition-colors">
          <Home size={15} />
        </button>

        {/* Path input */}
        <form
          className="flex-1 mx-1"
          onSubmit={(e) => { e.preventDefault(); navigate(navInput); }}
        >
          <input
            type="text"
            value={navInput}
            onChange={(e) => setNavInput(e.target.value)}
            className="w-full px-2.5 py-1 bg-gray-700/60 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-blue-400 font-mono"
          />
        </form>

        <button onClick={() => listFiles(currentPath)} className="p-1.5 hover:bg-white/10 rounded transition-colors" title="Refresh">
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
        <button onClick={() => setNewItemMode('file')} className="p-1.5 hover:bg-white/10 rounded transition-colors" title="New File">
          <Plus size={15} />
        </button>
        <button onClick={() => setNewItemMode('folder')} className="p-1.5 hover:bg-white/10 rounded transition-colors" title="New Folder">
          <FolderPlus size={15} />
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 bg-gray-800/40 border-b border-white/5 text-xs text-white/50 shrink-0 overflow-x-auto">
        <button onClick={() => navigate('/')} className="hover:text-white transition-colors flex items-center gap-1">
          <Home size={11} /> Root
        </button>
        {breadcrumbs.map((crumb, i) => {
          const p = '/' + breadcrumbs.slice(0, i + 1).join('/');
          return (
            <span key={p} className="flex items-center gap-0.5">
              <ChevronRight size={11} />
              <button onClick={() => navigate(p)} className="hover:text-white transition-colors">
                {crumb}
              </button>
            </span>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 py-2 bg-red-900/40 border-b border-red-500/30 text-red-300 text-xs flex justify-between">
          {error}
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">✕</button>
        </div>
      )}

      {/* File List */}
      <div className="flex-1 overflow-auto p-2" onContextMenu={handleDesktopContextMenu}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white/40">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading...</p>
            </div>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/30">
            <Folder size={48} className="mb-3 opacity-30" />
            <p className="text-sm">This folder is empty</p>
            <p className="text-xs mt-1">Right-click to create new files</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {/* New item input */}
            {newItemMode && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg mb-1">
                {newItemMode === 'folder' ? <Folder size={15} className="text-yellow-400" /> : <File size={15} className="text-white/50" />}
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateItem();
                    if (e.key === 'Escape') { setNewItemMode(null); setNewItemName(''); }
                  }}
                  placeholder={newItemMode === 'folder' ? 'Folder name...' : 'File name...'}
                  className="flex-1 bg-transparent text-white text-sm focus:outline-none"
                  autoFocus
                />
                <button onClick={handleCreateItem} className="text-blue-400 hover:text-blue-200 text-xs">Create</button>
                <button onClick={() => { setNewItemMode(null); setNewItemName(''); }} className="text-white/30 hover:text-white/60 text-xs">✕</button>
              </div>
            )}

            {files.map((file) => (
              <div
                key={file.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group transition-colors ${
                  selected === file.path ? 'bg-blue-500/20 border border-blue-500/30' : 'hover:bg-white/5'
                }`}
                onClick={() => setSelected(file.path)}
                onDoubleClick={() => handleFileOpen(file)}
                onContextMenu={(e) => handleFileContextMenu(e, file)}
              >
                {renaming === file.path ? (
                  <>
                    {file.type === 'directory' ? <Folder size={15} className="text-yellow-400" /> : getFileIcon(file.name, file.type)}
                    <input
                      type="text"
                      value={renameVal}
                      onChange={(e) => setRenameVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename();
                        if (e.key === 'Escape') setRenaming(null);
                      }}
                      className="flex-1 bg-blue-900/40 border border-blue-400 text-white text-sm px-1 rounded focus:outline-none"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button onClick={handleRename} className="text-blue-400 text-xs">✓</button>
                  </>
                ) : (
                  <>
                    {file.type === 'directory'
                      ? <Folder size={15} className="text-yellow-400 shrink-0" />
                      : getFileIcon(file.name, file.type)}
                    <span className="text-sm text-white/90 flex-1 truncate">{file.name}</span>
                    {file.size !== undefined && file.type === 'file' && (
                      <span className="text-white/30 text-xs mr-2 hidden group-hover:block">
                        {file.size < 1024 ? `${file.size}B` : `${(file.size / 1024).toFixed(1)}KB`}
                      </span>
                    )}
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setRenaming(file.path); setRenameVal(file.name); }}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                        title="Rename"
                      >
                        <Edit3 size={12} className="text-white/50" />
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await deleteItem(file.path);
                          notify('success', 'Deleted', `"${file.name}" deleted`);
                        }}
                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={12} className="text-red-400" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="px-3 py-1 bg-gray-800/60 border-t border-white/5 text-xs text-white/30 flex justify-between shrink-0">
        <span>{files.length} item{files.length !== 1 ? 's' : ''}</span>
        <span>{selected ? files.find((f) => f.path === selected)?.name || '' : ''}</span>
      </div>
    </div>
  );
}
