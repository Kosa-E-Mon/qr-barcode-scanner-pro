import { useEffect, useState, useRef, KeyboardEvent } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { 
  QrCode, 
  Barcode,
  History, 
  Trash2, 
  Camera, 
  Copy, 
  ExternalLink,
  ChevronRight,
  Maximize2,
  CheckCircle2,
  Clock,
  Database,
  Keyboard,
  Settings2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ScannedResult {
  id: string;
  data: string;
  timestamp: number;
  type: string;
  source: "CAMERA" | "HARDWARE";
}

export default function App() {
  const [results, setResults] = useState<ScannedResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ScannedResult | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [hardwareInput, setHardwareInput] = useState("");
  const [isAutoRedirect, setIsAutoRedirect] = useState(false); // New state for Auto-Execute
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Camera Scanner Setup
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      /* verbose= */ false
    );

    scanner.render(onCameraScanSuccess, onScanFailure);
    scannerRef.current = scanner;

    // Focus hardware input on load
    inputRef.current?.focus();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => console.error("Failed to clear", error));
      }
    };
  }, []);

  const handleDataAction = (data: string) => {
    // 1. Auto Copy to Clipboard
    navigator.clipboard.writeText(data).catch(err => console.error("Clipboard error", err));

    // 2. Auto Redirect if enabled
    if (isAutoRedirect) {
      if (isUrl(data)) {
        window.open(data, '_blank');
      } else {
        // Search query if not a URL
        window.open(`https://www.google.com/search?q=${encodeURIComponent(data)}`, '_blank');
      }
    }
  };

  function onCameraScanSuccess(decodedText: string, decodedResult: any) {
    const newResult: ScannedResult = {
      id: Math.random().toString(36).substring(7).toUpperCase(),
      data: decodedText,
      timestamp: Date.now(),
      type: decodedResult?.result?.format?.formatName || "QR_CODE",
      source: "CAMERA"
    };

    setResults(prev => [newResult, ...prev]);
    setSelectedResult(newResult);
    handleDataAction(decodedText);
  }

  function onScanFailure() {}

  // Hardware Scanner (HID) Handler
  const handleHardwareInput = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && hardwareInput.trim()) {
      const data = hardwareInput.trim();
      const newResult: ScannedResult = {
        id: Math.random().toString(36).substring(7).toUpperCase(),
        data: data,
        timestamp: Date.now(),
        type: "EXTERNAL_SCANNER",
        source: "HARDWARE"
      };
      setResults(prev => [newResult, ...prev]);
      setSelectedResult(newResult);
      setHardwareInput("");
      handleDataAction(data);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopying(true);
      setTimeout(() => setIsCopying(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  const clearHistory = () => {
    setResults([]);
    setSelectedResult(null);
  };

  const isUrl = (text: string) => {
    try {
      new URL(text);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gb-bg overflow-hidden text-gb-ink font-sans" onClick={() => inputRef.current?.focus()}>
      {/* Hidden input to capture hardware scanner data */}
      <input
        ref={inputRef}
        type="text"
        className="fixed -top-10 opacity-0 pointer-events-none"
        value={hardwareInput}
        onChange={(e) => setHardwareInput(e.target.value)}
        onKeyDown={handleHardwareInput}
        placeholder="Waiting for scanner..."
      />

      {/* Sidebar - History */}
      <aside className="w-full md:w-[340px] bg-white border-r border-gb-border flex flex-col h-1/3 md:h-full shrink-0">
        <div className="p-8 border-b border-gb-border">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-semibold tracking-tight uppercase flex items-center gap-2">
              <History className="w-5 h-5 text-gb-accent" />
              スキャン履歴
            </h1>
            <button 
              onClick={clearHistory}
              className="p-1.5 hover:bg-gb-bg rounded-md text-gb-secondary hover:text-red-500 transition-colors"
              title="履歴をクリア"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] font-mono text-gb-secondary uppercase tracking-widest flex justify-between">
            <span>{results.length} 入力済み</span>
            <span className="opacity-40 select-none">SCAN_LOG_V2</span>
          </p>
        </div>

        <div className="flex-1 overflow-y-auto bg-white">
          <AnimatePresence initial={false}>
            {results.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-3">
                <Clock className="w-8 h-8 text-gb-border" />
                <p className="text-xs text-gb-secondary font-medium italic">履歴がありません</p>
              </div>
            ) : (
              results.map((result) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedResult(result);
                  }}
                  className={`px-6 py-5 border-b border-gb-border cursor-pointer transition-all relative group ${
                    selectedResult?.id === result.id ? 'bg-gb-bg border-l-4 border-l-gb-accent' : 'hover:bg-gb-bg/50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-gb-secondary uppercase tracking-tighter">#{result.id}</span>
                      {result.source === "HARDWARE" && <Keyboard className="w-3 h-3 text-gb-accent" />}
                      {result.source === "CAMERA" && <Camera className="w-3 h-3 text-gb-secondary" />}
                    </div>
                    <span className="text-[10px] text-gb-secondary">
                      {new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-sm font-medium truncate pr-4">
                    {result.data}
                  </div>
                  <ChevronRight className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gb-border transition-transform group-hover:translate-x-1 ${selectedResult?.id === result.id ? 'opacity-100' : 'opacity-0'}`} />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 flex flex-col gap-8 h-2/3 md:h-full overflow-y-auto">
        <div className="flex-1 flex flex-col gap-8 max-w-4xl w-full mx-auto">
          
          <header className="flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className="bg-gb-accent text-white p-2 rounded-lg">
                  <Barcode className="w-6 h-6" />
                </div>
                <div>
                   <h2 className="text-xl font-bold tracking-tight uppercase italic">QR & Barcode Scanner</h2>
                   <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-widest text-gb-secondary">
                      <span className="flex items-center gap-1"><Camera className="w-2 h-2" /> Camera Ready</span>
                      <span className="w-1 h-1 rounded-full bg-gb-border" />
                      <span className="flex items-center gap-1 text-gb-accent"><Keyboard className="w-2 h-2" /> Hardware Sync Active</span>
                   </div>
                </div>
             </div>
             
             <div className="flex items-center gap-4">
                {/* Auto Redirect Toggle */}
                <div className="flex items-center gap-2 bg-white border border-gb-border px-4 py-2 rounded-lg shadow-sm">
                   <div className="flex flex-col">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-gb-secondary">Smart Redirect</span>
                      <span className={`text-[10px] font-bold ${isAutoRedirect ? 'text-gb-accent' : 'text-gb-secondary opacity-50'}`}>
                         {isAutoRedirect ? 'AUTO_OPEN: ON' : 'AUTO_OPEN: OFF'}
                      </span>
                   </div>
                   <button 
                     onClick={(e) => {
                        e.stopPropagation();
                        setIsAutoRedirect(!isAutoRedirect);
                     }}
                     className={`w-10 h-6 rounded-full transition-colors relative ${isAutoRedirect ? 'bg-gb-accent' : 'bg-gb-border'}`}
                   >
                      <motion.div 
                        animate={{ x: isAutoRedirect ? 16 : 2 }}
                        className="w-4 h-4 bg-white rounded-full absolute top-1"
                      />
                   </button>
                </div>

                <div className="hidden lg:block bg-white border border-gb-border px-4 py-2 rounded-lg shadow-sm">
                   <span className="font-mono text-[10px] uppercase tracking-widest text-gb-secondary">Focus Status:</span>
                   <span className="ml-2 font-mono text-[10px] text-gb-success font-bold">LOCKED</span>
                </div>
             </div>
          </header>

          {/* Detail Card */}
          <div className="bg-white border border-gb-border rounded-xl p-6 md:p-10 shadow-sm flex flex-col min-h-full">
            
            {/* Detail Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-10 pb-8 border-b border-gb-border">
              <div>
                <div className="flex gap-2 mb-3">
                  <span className={`inline-block px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${isUrl(selectedResult?.data || '') ? 'bg-blue-50 text-gb-accent' : 'bg-green-50 text-gb-success'}`}>
                    {isUrl(selectedResult?.data || '') ? 'URL検出' : 'データ検出'}
                  </span>
                  {selectedResult?.source === "HARDWARE" && (
                     <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Keyboard className="w-3 h-3" /> HIDデバイス
                     </span>
                  )}
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">スキャンデータ詳細</h2>
              </div>
              <div className="md:text-right">
                <span className="text-[11px] text-gb-secondary uppercase tracking-widest block mb-1">スキャン日時</span>
                <div className="font-medium text-sm tabular-nums">
                  {selectedResult ? new Date(selectedResult.timestamp).toLocaleString('ja-JP') : '--'}
                </div>
              </div>
            </div>

            {/* Top Section: Scanner or Preview */}
            <div className="flex flex-col lg:flex-row gap-10 mb-10">
              <div className="w-full lg:w-[280px] shrink-0">
                <div className="scanner-video-container aspect-square mb-2 relative group overflow-hidden cursor-crosshair">
                  <div id="reader" className="w-full h-full opacity-0 hover:opacity-100 transition-opacity absolute inset-0 z-10"></div>
                  
                  {/* Visual UI when scanner is active / hidden */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5 z-0 gap-3">
                    <QrCode className="w-12 h-12 text-gb-border/40" />
                    <p className="text-[9px] font-mono uppercase tracking-widest text-gb-secondary opacity-50 px-8 text-center">
                      Hover to use camera scanner
                    </p>
                  </div>

                  {/* Geometric Decoration */}
                  <div className="absolute top-4 left-4 w-4 h-[2px] bg-white/30 z-20" />
                  <div className="absolute top-4 left-4 w-[2px] h-4 bg-white/30 z-20" />
                  <div className="absolute bottom-4 right-4 w-4 h-[2px] bg-white/30 z-20" />
                  <div className="absolute bottom-4 right-4 w-[2px] h-4 bg-white/30 z-20" />
                  
                  <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gb-accent/20 animate-pulse z-20" />
                </div>
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-2 text-gb-secondary">
                    <Camera className="w-3 h-3" />
                    <span className="text-[10px] uppercase font-mono tracking-widest">CAM_INPUT</span>
                  </div>
                  <div className="flex items-center gap-2 text-gb-accent">
                    <Keyboard className="w-3 h-3" />
                    <span className="text-[10px] uppercase font-mono tracking-widest">HID_SYNC</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-6">
                <div>
                  <span className="block text-[11px] uppercase text-gb-secondary tracking-widest mb-2">コンテンツ</span>
                  <div className="text-xl font-normal tracking-tight">
                    {selectedResult ? (isUrl(selectedResult.data) ? 'Webサイト (URL)' : 'コード/テキスト') : '--'}
                  </div>
                </div>
                <div className="flex gap-10">
                  <div>
                    <span className="block text-[11px] uppercase text-gb-secondary tracking-widest mb-2">形式</span>
                    <div className="font-mono text-sm bg-gb-bg inline-block px-2 py-1 rounded border border-gb-border/50">
                      {selectedResult?.type || '--'}
                    </div>
                  </div>
                  <div>
                    <span className="block text-[11px] uppercase text-gb-secondary tracking-widest mb-2">ソース</span>
                    <div className="font-mono text-sm bg-gb-bg inline-block px-2 py-1 rounded border border-gb-border/50 text-[10px]">
                      {selectedResult?.source || '--'}
                    </div>
                  </div>
                </div>
                {selectedResult && (
                  <div>
                    <span className="block text-[11px] uppercase text-gb-secondary tracking-widest mb-2">主要なデータ</span>
                    <div className={`text-lg break-all font-mono leading-relaxed bg-gb-bg/30 p-4 rounded-lg border border-gb-border/20 ${isUrl(selectedResult.data) ? 'text-gb-accent underline underline-offset-4 cursor-pointer hover:opacity-80' : ''}`}>
                      {selectedResult.data}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Section: Raw Data */}
            <div className="mt-auto pt-8 border-t border-gb-border">
              <span className="block text-[11px] uppercase text-gb-secondary tracking-widest mb-4">未加工データ (JSON)</span>
              <div className="bg-gb-ink text-white p-6 rounded-lg font-mono text-[12px] leading-relaxed break-all whitespace-pre-wrap relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-bl from-white pointer-events-none w-full h-full" />
                {selectedResult ? JSON.stringify(selectedResult, null, 2) : 'スキャン待ち...'}
              </div>

              <div className="flex flex-wrap gap-3 mt-8">
                {selectedResult && isUrl(selectedResult.data) && (
                  <a
                    href={selectedResult.data}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gb-accent text-white px-6 py-2.5 rounded-md text-[13px] font-medium transition-all hover:bg-gb-accent/90 active:scale-95 flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    ブラウザで開く
                  </a>
                )}
                {selectedResult && (
                  <button
                    onClick={() => copyToClipboard(selectedResult.data)}
                    className={`px-6 py-2.5 rounded-md text-[13px] font-medium transition-all flex items-center gap-2 border border-gb-border active:scale-95 ${
                      isCopying ? 'bg-gb-success text-white border-gb-success shadow-gb-success/20 shadow-lg' : 'bg-white hover:bg-gb-bg'
                    }`}
                  >
                    {isCopying ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {isCopying ? 'コピーしました' : 'クリップボードにコピー'}
                  </button>
                )}
                <button className="px-6 py-2.5 rounded-md text-[13px] font-medium transition-all border border-gb-border bg-white hover:bg-gb-bg flex items-center gap-2 text-gb-secondary">
                  <Database className="w-4 h-4" />
                  CSVでエクスポート
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
