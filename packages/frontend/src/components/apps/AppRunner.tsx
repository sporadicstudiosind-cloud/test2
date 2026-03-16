import { useEffect, useRef, useState } from 'react';
import { AppManifest } from '../../types';
import { ExternalLink, AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  manifest?: AppManifest;
}

export function AppRunner({ manifest }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    setBlocked(false);
  }, [manifest?.entry, reloadKey]);

  if (!manifest) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-950 text-white/40">
        <div className="text-center">
          <span className="text-4xl block mb-3">🔲</span>
          <p>No app loaded</p>
        </div>
      </div>
    );
  }

  if (manifest.type === 'apk') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-950 text-white p-8 text-center">
        <span className="text-5xl mb-4">🤖</span>
        <h3 className="text-xl font-bold mb-2">APK Support</h3>
        <p className="text-white/50 text-sm mb-6 max-w-sm">
          Android APK files can be run using a WebAssembly-based Android runtime. This requires additional setup.
        </p>
        <div className="p-4 bg-gray-900 rounded-xl border border-white/5 text-left w-full max-w-sm space-y-2 text-sm text-white/60 mb-6">
          <p className="text-white font-medium">How to run APKs:</p>
          <p>1. Install the <strong className="text-white">Android Runtime</strong> app from the App Store</p>
          <p>2. The runtime will handle APK loading and execution</p>
          <p>3. Alternatively, use an Android emulator web service</p>
        </div>
        <a
          href="https://waydro.id/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm transition-colors"
        >
          <ExternalLink size={14} /> Learn about Waydroid
        </a>
      </div>
    );
  }

  if (manifest.type === 'react') {
    // React apps are loaded as ES modules in an iframe
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${manifest.name}</title>
  <style>body{margin:0;background:#0f172a;color:white;font-family:sans-serif}</style>
</head>
<body>
  <div id="root"></div>
  <script type="importmap">${JSON.stringify({
    imports: {
      react: 'https://esm.sh/react@18',
      'react-dom': 'https://esm.sh/react-dom@18',
      'react-dom/client': 'https://esm.sh/react-dom@18/client',
    }
  })}</script>
  <script type="module">
    // Send OS API bridge messages
    const osApi = {
      notify: (type, title, msg) => window.parent.postMessage({type:'os:notify', payload:{type,title,msg}}, '*'),
    };
    window.__os = osApi;
    // Load the React component
    import('${manifest.entry}').catch(e => {
      document.getElementById('root').innerHTML = '<div style="padding:20px;color:#f87171">Failed to load app: ' + e.message + '</div>';
    });
  </script>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const src = URL.createObjectURL(blob);
    return (
      <div className="w-full h-full relative">
        <iframe
          src={src}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-modals allow-popups"
          title={manifest.name}
        />
      </div>
    );
  }

  // Web app (iframe)
  return (
    <div className="w-full h-full relative flex flex-col">
      {blocked ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 p-8 text-center">
          <AlertTriangle size={40} className="text-yellow-400 mb-4" />
          <h3 className="text-white text-lg font-semibold mb-2">Site Can't Be Displayed</h3>
          <p className="text-white/50 text-sm mb-6">
            <code className="bg-white/10 px-1.5 py-0.5 rounded">{manifest.entry}</code>
            <br />
            <span className="text-xs mt-1 block">This site blocks iframe embedding (X-Frame-Options)</span>
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { setReloadKey((k) => k + 1); }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
            >
              <RefreshCw size={14} /> Retry
            </button>
            <a
              href={manifest.entry}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg text-sm transition-colors"
            >
              <ExternalLink size={14} /> Open in New Tab
            </a>
          </div>
        </div>
      ) : (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-950 z-10">
              <div className="text-center text-white/40">
                <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm">Loading {manifest.name}...</p>
              </div>
            </div>
          )}
          <iframe
            key={reloadKey}
            ref={iframeRef}
            src={manifest.entry}
            className="w-full h-full border-0 bg-white"
            onLoad={() => setIsLoading(false)}
            onError={() => { setIsLoading(false); setBlocked(true); }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
            title={manifest.name}
          />
        </>
      )}
    </div>
  );
}
