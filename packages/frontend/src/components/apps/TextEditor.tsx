import { useState } from 'react';
import { Save, FileText } from 'lucide-react';

export function TextEditor() {
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('untitled.txt');
  const [saved, setSaved] = useState(true);

  const handleSave = () => {
    // TODO: Implement file saving
    setSaved(true);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setSaved(false);
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="bg-gray-100 border-b border-gray-300 p-2 flex gap-2 items-center">
        <div className="flex items-center gap-2 flex-1">
          <FileText size={16} className="text-gray-600" />
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 flex-1"
            placeholder="File name..."
          />
          {!saved && <span className="text-xs text-red-500">unsaved</span>}
        </div>
        <button
          onClick={handleSave}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
        >
          <Save size={14} /> Save
        </button>
      </div>

      {/* Editor */}
      <textarea
        value={content}
        onChange={handleContentChange}
        className="flex-1 p-4 resize-none focus:outline-none font-mono text-sm"
        placeholder="Start typing..."
      />
    </div>
  );
}
