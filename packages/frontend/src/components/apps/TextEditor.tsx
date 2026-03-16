import { useState, useEffect, useCallback } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { Save, FileText, FolderOpen, Hash } from 'lucide-react';

interface Props {
  windowId?: string;
  appData?: Record<string, unknown>;
}


export function TextEditor({ appData }: Props) {
  const { readFile, writeFile } = useFileStore();
  const { add: notify } = useNotificationStore();

  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('untitled.txt');
  const [filePath, setFilePath] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);
  const [fontSize, setFontSize] = useState(13);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [savePathInput, setSavePathInput] = useState('');
  const [showSaveAs, setShowSaveAs] = useState(false);

  // Load file if opened from file explorer
  useEffect(() => {
    const fp = appData?.filePath as string | undefined;
    const fn = appData?.fileName as string | undefined;
    if (fp) {
      setFilePath(fp);
      setFileName(fn || fp.split('/').pop() || 'file');
      setSavePathInput(fp);
      setIsLoading(true);
      readFile(fp)
        .then((c) => { setContent(c); setIsSaved(true); })
        .catch((e) => notify('error', 'Failed to open', e.message))
        .finally(() => setIsLoading(false));
    }
  }, []);

  const handleSave = useCallback(async (path?: string) => {
    const saveTo = path || filePath;
    if (!saveTo) { setShowSaveAs(true); return; }
    try {
      await writeFile(saveTo, content);
      setFilePath(saveTo);
      setFileName(saveTo.split('/').pop() || 'file');
      setIsSaved(true);
      notify('success', 'Saved', saveTo);
    } catch (e: any) {
      notify('error', 'Save failed', e.message);
    }
  }, [filePath, content, writeFile, notify]);

  // Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsSaved(false);
  };

  const handleCursorMove = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    const text = ta.value.substring(0, ta.selectionStart);
    const lines = text.split('\n');
    setCursorPos({ line: lines.length, col: lines[lines.length - 1].length + 1 });
  };

  const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      setContent(newContent);
      setIsSaved(false);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  const lines = content.split('\n');
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const langLabel = ext === 'ts' || ext === 'tsx' ? 'TypeScript' : ext === 'js' || ext === 'jsx' ? 'JavaScript' : ext === 'py' ? 'Python' : ext === 'md' ? 'Markdown' : ext === 'json' ? 'JSON' : 'Plain Text';

  return (
    <div className="w-full h-full flex flex-col bg-gray-950 text-white">
      {/* Menu bar */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 border-b border-white/5 text-xs shrink-0">
        <span className="text-white/60 mr-2 flex items-center gap-1">
          <FileText size={13} />
          <span className="font-medium">{fileName}</span>
          {!isSaved && <span className="text-yellow-400 ml-1">●</span>}
        </span>

        <button
          onClick={() => handleSave()}
          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors flex items-center gap-1"
        >
          <Save size={12} /> Save
        </button>
        <button
          onClick={() => { setSavePathInput(filePath || '/Documents/' + fileName); setShowSaveAs(true); }}
          className="px-2.5 py-1 hover:bg-white/10 text-white/60 rounded transition-colors"
        >
          Save As
        </button>
        <button
          onClick={() => { setShowLineNumbers((v) => !v); }}
          className={`px-2.5 py-1 rounded transition-colors ${showLineNumbers ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5'}`}
        >
          <Hash size={12} />
        </button>
        <button
          onClick={() => setWordWrap((v) => !v)}
          className={`px-2.5 py-1 rounded transition-colors text-xs ${wordWrap ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5'}`}
        >
          Wrap
        </button>
        <div className="flex items-center gap-1 ml-1">
          <button onClick={() => setFontSize((f) => Math.max(10, f - 1))} className="px-1.5 py-0.5 hover:bg-white/10 rounded text-white/50">−</button>
          <span className="text-white/40 text-xs w-8 text-center">{fontSize}px</span>
          <button onClick={() => setFontSize((f) => Math.min(24, f + 1))} className="px-1.5 py-0.5 hover:bg-white/10 rounded text-white/50">+</button>
        </div>
      </div>

      {/* Save As dialog */}
      {showSaveAs && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-900/40 border-b border-blue-500/30 shrink-0">
          <FolderOpen size={14} className="text-blue-400 shrink-0" />
          <input
            type="text"
            value={savePathInput}
            onChange={(e) => setSavePathInput(e.target.value)}
            placeholder="/Documents/filename.txt"
            className="flex-1 px-2 py-1 bg-gray-900 border border-blue-500/40 rounded text-sm text-white focus:outline-none focus:border-blue-400"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') { handleSave(savePathInput); setShowSaveAs(false); }
              if (e.key === 'Escape') setShowSaveAs(false);
            }}
          />
          <button onClick={() => { handleSave(savePathInput); setShowSaveAs(false); }} className="px-3 py-1 bg-blue-500 hover:bg-blue-400 text-white text-sm rounded transition-colors">
            Save
          </button>
          <button onClick={() => setShowSaveAs(false)} className="text-white/40 hover:text-white/70 transition-colors">✕</button>
        </div>
      )}

      {/* Editor area */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-white/40">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-2" />
            Loading file...
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Line numbers */}
          {showLineNumbers && (
            <div
              className="shrink-0 px-3 py-3 text-right text-white/20 font-mono overflow-hidden select-none bg-gray-900/50 border-r border-white/5"
              style={{ fontSize, lineHeight: '1.5rem', minWidth: '3rem' }}
            >
              {lines.map((_, i) => (
                <div key={i} style={{ lineHeight: '1.5rem' }}>{i + 1}</div>
              ))}
            </div>
          )}

          {/* Textarea */}
          <textarea
            value={content}
            onChange={handleChange}
            onSelect={handleCursorMove}
            onClick={handleCursorMove}
            onKeyDown={handleTab}
            className="flex-1 p-3 resize-none focus:outline-none font-mono bg-transparent text-white/90 caret-blue-400"
            style={{
              fontSize,
              lineHeight: '1.5rem',
              whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
              overflowX: wordWrap ? 'hidden' : 'auto',
            }}
            placeholder={isLoading ? '' : 'Start typing... (Ctrl+S to save)'}
            spellCheck={false}
          />
        </div>
      )}

      {/* Status bar */}
      <div className="flex items-center gap-4 px-3 py-1 bg-gray-900/80 border-t border-white/5 text-xs text-white/30 shrink-0">
        <span>{langLabel}</span>
        <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
        <span>{lines.length} lines</span>
        <span className="ml-auto">{content.length} chars</span>
        {isSaved ? <span className="text-green-400/70">Saved</span> : <span className="text-yellow-400/70">Unsaved</span>}
      </div>
    </div>
  );
}
