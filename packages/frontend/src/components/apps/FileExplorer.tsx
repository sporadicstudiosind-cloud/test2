import { useEffect, useState } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { ChevronRight, Folder, File, Plus, Trash2 } from 'lucide-react';

export function FileExplorer() {
  const { currentPath, files, isLoading, listFiles, createFile, deleteFile } = useFileStore();
  const [newFileName, setNewFileName] = useState('');

  useEffect(() => {
    listFiles('/');
  }, [listFiles]);

  const handleNavigate = (path: string) => {
    listFiles(path);
  };

  const handleCreateFile = async () => {
    if (newFileName.trim()) {
      const filePath = currentPath === '/' ? `/${newFileName}` : `${currentPath}/${newFileName}`;
      await createFile(filePath, '');
      setNewFileName('');
    }
  };

  const handleDeleteFile = async (fileName: string) => {
    const filePath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`;
    await deleteFile(filePath);
  };

  const breadcrumbs = currentPath.split('/').filter(Boolean);

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="bg-gray-100 border-b border-gray-300 p-2 flex gap-2 items-center">
        <button
          onClick={() => handleNavigate('/')}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
        >
          Home
        </button>
        <input
          type="text"
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleCreateFile()}
          placeholder="New file name..."
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleCreateFile}
          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors flex items-center gap-1"
        >
          <Plus size={14} /> New
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-300 px-3 py-2 text-sm text-gray-700 flex items-center gap-1">
        <button onClick={() => handleNavigate('/')} className="hover:underline">
          Root
        </button>
        {breadcrumbs.map((crumb, index) => {
          const path = '/' + breadcrumbs.slice(0, index + 1).join('/');
          return (
            <div key={path} className="flex items-center gap-1">
              <ChevronRight size={14} />
              <button onClick={() => handleNavigate(path)} className="hover:underline">
                {crumb}
              </button>
            </div>
          );
        })}
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-4 text-gray-500">Loading...</div>
        ) : files.length === 0 ? (
          <div className="p-4 text-gray-500">Empty directory</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {files.map((file) => (
              <div
                key={file.path}
                className="p-3 hover:bg-gray-50 flex items-center justify-between cursor-pointer group"
              >
                <div
                  className="flex items-center gap-2 flex-1"
                  onClick={() => {
                    if (file.type === 'directory') {
                      handleNavigate(file.path);
                    }
                  }}
                >
                  {file.type === 'directory' ? (
                    <Folder size={16} className="text-yellow-500" />
                  ) : (
                    <File size={16} className="text-gray-400" />
                  )}
                  <span className="text-sm text-gray-800">{file.name}</span>
                </div>
                <button
                  onClick={() => handleDeleteFile(file.name)}
                  className="p-1 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded transition-all"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
