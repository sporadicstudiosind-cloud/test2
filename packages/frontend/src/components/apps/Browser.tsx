import { useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCw } from 'lucide-react';

export function Browser() {
  const [url, setUrl] = useState('https://example.com');
  const [isLoading, setIsLoading] = useState(false);

  const handleNavigate = () => {
    setIsLoading(true);
    // TODO: Implement actual browser navigation using backend proxy
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Browser Toolbar */}
      <div className="bg-gray-100 border-b border-gray-300 p-2 flex gap-2 items-center">
        <button
          className="p-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors disabled:opacity-50"
          disabled
          title="Back"
        >
          <ArrowLeft size={14} />
        </button>
        <button
          className="p-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors disabled:opacity-50"
          disabled
          title="Forward"
        >
          <ArrowRight size={14} />
        </button>
        <button
          onClick={handleNavigate}
          className="p-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors disabled:opacity-50"
          disabled={isLoading}
          title="Refresh"
        >
          <RotateCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>

        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleNavigate()}
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
          placeholder="Enter URL..."
        />
        <button
          onClick={handleNavigate}
          disabled={isLoading}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          Go
        </button>
      </div>

      {/* Browser Content Area */}
      <div className="flex-1 bg-white overflow-auto flex items-center justify-center text-gray-500">
        {isLoading ? (
          <div className="text-center">
            <div className="animate-spin text-4xl mb-2">⟳</div>
            <p>Loading...</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg mb-2">🌐 Web Browser</p>
            <p className="text-sm">Browser feature coming soon!</p>
            <p className="text-xs mt-2">Enter a URL and press Enter to navigate</p>
          </div>
        )}
      </div>
    </div>
  );
}
