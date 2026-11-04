import React, { useState, useEffect, useRef } from 'react';
import { FuzzWordResult, MockEndpointConfig } from '../../types';
import { 
  Play, Pause, Square, RotateCcw, Download, Copy, Check, Terminal, 
  Settings, FileText, CheckCircle2, AlertCircle, XCircle, Clock, 
  ShieldAlert, Plus, Trash2, ArrowRight
} from 'lucide-react';

const DEFAULT_WORDS = ['test', 'hello', 'world', 'fuzzer', 'api', 'example'];

const EXPANDED_SECURITY_WORDS = [
  'test', 'hello', 'world', 'fuzzer', 'api', 'example',
  'admin', 'health', 'v1', 'v2', 'users', 'login', 'auth', 
  'config', 'metrics', 'debug', 'swagger', 'docs', 'backup', 'status'
];

const INITIAL_MOCK_ENDPOINTS: MockEndpointConfig[] = [
  { word: 'test', status: 200, response: { message: "Success!", word: "test", timestamp: "2025-02-18T14:30:00Z" } },
  { word: 'health', status: 200, response: { status: "UP", uptime: 38491, checks: { database: "healthy" } } },
  { word: 'v1', status: 200, response: { version: "1.0.4", supportedMethods: ["GET", "POST"] } },
  { word: 'users', status: 200, response: { count: 3, items: [{ id: 1, username: "admin" }, { id: 2, username: "guest" }] } },
  { word: 'admin', status: 403, response: { error: "Forbidden", message: "Administrative privileges required." } },
  { word: 'config', status: 403, response: { error: "Access Denied", file: "settings.prod.json" } },
  { word: 'debug', status: 500, response: { error: "Internal Server Error", trace: "NullPointer in DebugHandler.py:42" } }
];

export const ApiFuzzerModule: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'fuzzer' | 'server_config' | 'python_code'>('fuzzer');
  const [targetBaseUrl, setTargetBaseUrl] = useState('http://localhost:8080/api');
  const [wordsText, setWordsText] = useState(DEFAULT_WORDS.join('\n'));
  const [delayMs, setDelayMs] = useState(120);
  const [mockEndpoints, setMockEndpoints] = useState<MockEndpointConfig[]>(INITIAL_MOCK_ENDPOINTS);

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<FuzzWordResult[]>([]);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [selectedResult, setSelectedResult] = useState<FuzzWordResult | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'notfound' | 'error'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const runningRef = useRef(isRunning);
  const pausedRef = useRef(isPaused);
  const currentIndexRef = useRef(currentIndex);

  runningRef.current = isRunning;
  pausedRef.current = isPaused;
  currentIndexRef.current = currentIndex;

  const wordList = wordsText
    .split('\n')
    .map(w => w.trim())
    .filter(w => w.length > 0);

  // Auto-scroll terminal
  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight;
    }
  }, [terminalLogs, autoScroll]);

  // Fuzzing Execution Loop
  useEffect(() => {
    let timeoutId: any = null;

    const executeNext = () => {
      if (!runningRef.current || pausedRef.current) return;
      const idx = currentIndexRef.current;

      if (idx >= wordList.length) {
        setIsRunning(false);
        setTerminalLogs(prev => [...prev, `\n[INFO] Fuzzing complete! Scanned ${wordList.length} words.`]);
        return;
      }

      const word = wordList[idx];
      const startMs = performance.now();

      // Check simulated response
      const matchedEndpoint = mockEndpoints.find(e => e.word.toLowerCase() === word.toLowerCase());
      const statusCode = matchedEndpoint ? matchedEndpoint.status : 404;
      const durationMs = Math.round(startMs % 40) + 12; // Realistic network latency
      const responseData = matchedEndpoint ? matchedEndpoint.response : { error: "Not found" };
      const responseBody = JSON.stringify(responseData, null, 2);

      const result: FuzzWordResult = {
        id: `${word}-${Date.now()}-${idx}`,
        word,
        url: `${targetBaseUrl}/${word}`,
        statusCode,
        statusText: statusCode === 200 ? 'OK' : statusCode === 404 ? 'Not Found' : statusCode === 403 ? 'Forbidden' : 'Error',
        durationMs,
        responseSize: responseBody.length,
        responseBody,
        timestamp: new Date().toLocaleTimeString(),
        isCustomSuccess: statusCode === 200
      };

      setResults(prev => [result, ...prev]);

      // Terminal output matching main.py logic
      if (statusCode === 404) {
        setTerminalLogs(prev => [...prev, `[404] Not found: ${word}`]);
      } else {
        setTerminalLogs(prev => [
          ...prev, 
          `[${statusCode}] Found: ${word}`,
          `    -> ${JSON.stringify(responseData)}`
        ]);
      }

      setCurrentIndex(idx + 1);
      timeoutId = setTimeout(executeNext, delayMs);
    };

    if (isRunning && !isPaused) {
      timeoutId = setTimeout(executeNext, delayMs);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isRunning, isPaused, currentIndex, wordList, delayMs, targetBaseUrl, mockEndpoints]);

  const handleStart = () => {
    if (currentIndex >= wordList.length) {
      setCurrentIndex(0);
      setResults([]);
      setTerminalLogs([`[INFO] Starting API Fuzzer targeting ${targetBaseUrl}/{word}...`]);
    } else if (results.length === 0) {
      setTerminalLogs([`[INFO] Starting API Fuzzer targeting ${targetBaseUrl}/{word}...`]);
    }
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentIndex(0);
    setResults([]);
    setTerminalLogs([]);
    setSelectedResult(null);
  };

  const handleStep = () => {
    if (currentIndex < wordList.length) {
      const word = wordList[currentIndex];
      const matchedEndpoint = mockEndpoints.find(e => e.word.toLowerCase() === word.toLowerCase());
      const statusCode = matchedEndpoint ? matchedEndpoint.status : 404;
      const durationMs = 28;
      const responseData = matchedEndpoint ? matchedEndpoint.response : { error: "Not found" };
      const responseBody = JSON.stringify(responseData, null, 2);

      const result: FuzzWordResult = {
        id: `${word}-${Date.now()}-${currentIndex}`,
        word,
        url: `${targetBaseUrl}/${word}`,
        statusCode,
        statusText: statusCode === 200 ? 'OK' : 'Not Found',
        durationMs,
        responseSize: responseBody.length,
        responseBody,
        timestamp: new Date().toLocaleTimeString()
      };

      setResults(prev => [result, ...prev]);
      if (statusCode === 404) {
        setTerminalLogs(prev => [...prev, `[404] Not found: ${word}`]);
      } else {
        setTerminalLogs(prev => [...prev, `[${statusCode}] Found: ${word}`, `    -> ${responseBody}`]);
      }
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleLoadPreset = (type: 'default' | 'security') => {
    if (type === 'default') {
      setWordsText(DEFAULT_WORDS.join('\n'));
    } else {
      setWordsText(EXPANDED_SECURITY_WORDS.join('\n'));
    }
    handleReset();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setWordsText(text);
        handleReset();
      }
    };
    reader.readAsText(file);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const exportResultsJson = () => {
    const jsonStr = JSON.stringify(results, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-fuzzer-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stats calculation
  const totalScanned = results.length;
  const count200 = results.filter(r => r.statusCode === 200).length;
  const count404 = results.filter(r => r.statusCode === 404).length;
  const count403 = results.filter(r => r.statusCode === 403).length;
  const count500 = results.filter(r => r.statusCode >= 500).length;
  const progressPercent = wordList.length > 0 ? Math.round((currentIndex / wordList.length) * 100) : 0;

  const filteredResults = results.filter(r => {
    if (filterStatus === 'success') return r.statusCode === 200;
    if (filterStatus === 'notfound') return r.statusCode === 404;
    if (filterStatus === 'error') return r.statusCode !== 200 && r.statusCode !== 404;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Sub Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyber-border pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white tracking-wide">REST API Fuzzer</h2>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              main.py & server.py
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated URL path discovery & fuzzing with HTTP status code and response payload inspection
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('fuzzer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeSubTab === 'fuzzer'
                ? 'bg-emerald-500 text-slate-950 font-semibold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Fuzzing Workbench
          </button>
          <button
            onClick={() => setActiveSubTab('server_config')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeSubTab === 'server_config'
                ? 'bg-emerald-500 text-slate-950 font-semibold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Simulated Server Endpoints ({mockEndpoints.length})
          </button>
          <button
            onClick={() => setActiveSubTab('python_code')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeSubTab === 'python_code'
                ? 'bg-emerald-500 text-slate-950 font-semibold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Python Source Code
          </button>
        </div>
      </div>

      {activeSubTab === 'fuzzer' && (
        <>
          {/* Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-cyber-card border border-cyber-border">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Progress</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-xl font-bold font-mono text-white">{currentIndex}/{wordList.length}</span>
                <span className="text-xs text-slate-400">({progressPercent}%)</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full transition-all duration-200" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-cyber-card border border-cyber-border">
              <span className="text-[11px] font-mono text-emerald-400 uppercase">200 OK (Found)</span>
              <div className="flex items-center space-x-2 mt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xl font-bold font-mono text-emerald-400">{count200}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Valid endpoints</span>
            </div>

            <div className="p-3.5 rounded-xl bg-cyber-card border border-cyber-border">
              <span className="text-[11px] font-mono text-slate-400 uppercase">404 Not Found</span>
              <div className="flex items-center space-x-2 mt-1">
                <XCircle className="w-4 h-4 text-slate-500" />
                <span className="text-xl font-bold font-mono text-slate-300">{count404}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Expected misses</span>
            </div>

            <div className="p-3.5 rounded-xl bg-cyber-card border border-cyber-border">
              <span className="text-[11px] font-mono text-amber-400 uppercase">403 Forbidden</span>
              <div className="flex items-center space-x-2 mt-1">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span className="text-xl font-bold font-mono text-amber-400">{count403}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Protected resources</span>
            </div>

            <div className="p-3.5 rounded-xl bg-cyber-card border border-cyber-border">
              <span className="text-[11px] font-mono text-red-400 uppercase">500 Server Errors</span>
              <div className="flex items-center space-x-2 mt-1">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span className="text-xl font-bold font-mono text-red-400">{count500}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Application defects</span>
            </div>
          </div>

          {/* Controls & Configuration Bar */}
          <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              {/* Target Input */}
              <div className="lg:col-span-5 space-y-1">
                <label className="text-xs font-mono text-slate-300 flex items-center justify-between">
                  <span>Target Base URL</span>
                  <span className="text-[10px] text-emerald-400">Appends /{'{word}'}</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={targetBaseUrl}
                    onChange={(e) => setTargetBaseUrl(e.target.value)}
                    disabled={isRunning}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Delay Slider */}
              <div className="lg:col-span-3 space-y-1">
                <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                  <span>Delay: {delayMs}ms</span>
                  <span className="text-[10px] text-slate-400">
                    ~{(1000 / Math.max(1, delayMs)).toFixed(1)} req/s
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="600"
                  step="10"
                  value={delayMs}
                  onChange={(e) => setDelayMs(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="lg:col-span-4 flex items-center justify-start lg:justify-end space-x-2 pt-2 lg:pt-0">
                {!isRunning ? (
                  <button
                    onClick={handleStart}
                    disabled={wordList.length === 0}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Fuzzer</span>
                  </button>
                ) : isPaused ? (
                  <button
                    onClick={handleResume}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Resume</span>
                  </button>
                ) : (
                  <button
                    onClick={handlePause}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </button>
                )}

                <button
                  onClick={handleStep}
                  disabled={isRunning && !isPaused}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition disabled:opacity-50"
                  title="Execute single word"
                >
                  Step
                </button>

                <button
                  onClick={handleReset}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                  title="Reset counter & results"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {results.length > 0 && (
                  <button
                    onClick={exportResultsJson}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                    title="Export Results JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Workbench Grid: Left = Wordlist & Terminal, Right = Results Table & Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Wordlist & Terminal */}
            <div className="lg:col-span-5 space-y-6">
              {/* Wordlist Box */}
              <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Dictionary Wordlist</span>
                    <span className="text-[11px] font-mono text-slate-400">({wordList.length} words)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleLoadPreset('default')}
                      disabled={isRunning}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
                    >
                      words.txt
                    </button>
                    <button
                      onClick={() => handleLoadPreset('security')}
                      disabled={isRunning}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
                    >
                      Security 20
                    </button>
                  </div>
                </div>

                <textarea
                  value={wordsText}
                  onChange={(e) => setWordsText(e.target.value)}
                  disabled={isRunning}
                  rows={6}
                  placeholder="Enter one word per line..."
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <label className="cursor-pointer text-emerald-400 hover:text-emerald-300 flex items-center space-x-1">
                    <span>Upload wordlist (.txt)</span>
                    <input
                      type="file"
                      accept=".txt"
                      onChange={handleFileUpload}
                      disabled={isRunning}
                      className="hidden"
                    />
                  </label>
                  <span>1 word per line</span>
                </div>
              </div>

              {/* Terminal Logs (main.py format) */}
              <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-md">
                <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-mono text-slate-300">Terminal Log (main.py)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center space-x-1 text-[10px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoScroll}
                        onChange={(e) => setAutoScroll(e.target.checked)}
                        className="rounded accent-emerald-500"
                      />
                      <span>Auto-scroll</span>
                    </label>
                    <button
                      onClick={() => setTerminalLogs([])}
                      className="text-[10px] text-slate-400 hover:text-slate-200"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div 
                  ref={terminalEndRef}
                  className="p-3 h-56 overflow-y-auto font-mono text-xs space-y-1 text-slate-300 select-text bg-[#070a0f]"
                >
                  {terminalLogs.length === 0 ? (
                    <div className="text-slate-600 italic">
                      Waiting to launch... click 'Start Fuzzer' to begin sending test probes.
                    </div>
                  ) : (
                    terminalLogs.map((line, idx) => {
                      let colorClass = 'text-slate-400';
                      if (line.includes('[200]')) colorClass = 'text-emerald-400 font-semibold';
                      else if (line.includes('[404]')) colorClass = 'text-slate-500';
                      else if (line.includes('[403]')) colorClass = 'text-amber-400';
                      else if (line.includes('[500]')) colorClass = 'text-red-400';
                      else if (line.includes('[INFO]')) colorClass = 'text-cyan-400';
                      
                      return (
                        <div key={idx} className={`${colorClass} leading-tight`}>
                          {line}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Scanned Results Table & Details */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-white">Discovered Endpoints & Responses</h3>
                    <span className="text-xs font-mono text-slate-400">({filteredResults.length})</span>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                    <button
                      onClick={() => setFilterStatus('all')}
                      className={`px-2 py-0.5 rounded ${filterStatus === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'}`}
                    >
                      All ({results.length})
                    </button>
                    <button
                      onClick={() => setFilterStatus('success')}
                      className={`px-2 py-0.5 rounded ${filterStatus === 'success' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-slate-400'}`}
                    >
                      200 OK ({count200})
                    </button>
                    <button
                      onClick={() => setFilterStatus('notfound')}
                      className={`px-2 py-0.5 rounded ${filterStatus === 'notfound' ? 'bg-slate-800 text-slate-300 font-medium' : 'text-slate-400'}`}
                    >
                      404s ({count404})
                    </button>
                    <button
                      onClick={() => setFilterStatus('error')}
                      className={`px-2 py-0.5 rounded ${filterStatus === 'error' ? 'bg-amber-500/20 text-amber-300 font-medium' : 'text-slate-400'}`}
                    >
                      Errors/Auth ({count403 + count500})
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto max-h-96 overflow-y-auto border border-slate-800 rounded-lg">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Word</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Latency</th>
                        <th className="py-2 px-3">Size</th>
                        <th className="py-2 px-3 text-right">Inspect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {filteredResults.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                            {results.length === 0 ? 'No requests sent yet.' : 'No results match filter.'}
                          </td>
                        </tr>
                      ) : (
                        filteredResults.map((item) => {
                          const isSelected = selectedResult?.id === item.id;
                          return (
                            <tr
                              key={item.id}
                              onClick={() => setSelectedResult(item)}
                              className={`cursor-pointer transition hover:bg-slate-800/40 ${
                                isSelected ? 'bg-emerald-500/10' : ''
                              }`}
                            >
                              <td className="py-2 px-3 font-semibold text-slate-200">
                                /{item.word}
                              </td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  item.statusCode === 200
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : item.statusCode === 404
                                    ? 'bg-slate-800 text-slate-400'
                                    : item.statusCode === 403
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                }`}>
                                  {item.statusCode} {item.statusText}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-400">{item.durationMs}ms</td>
                              <td className="py-2 px-3 text-slate-400">{item.responseSize} B</td>
                              <td className="py-2 px-3 text-right">
                                <span className="text-[11px] text-emerald-400 underline hover:text-emerald-300">
                                  View
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Selected Result Payload Inspector */}
              {selectedResult && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">Payload Inspector:</span>
                      <code className="text-xs font-mono text-emerald-400">{selectedResult.url}</code>
                    </div>
                    <button
                      onClick={() => copyToClipboard(selectedResult.responseBody, 'payload')}
                      className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200"
                    >
                      {copiedCode === 'payload' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode === 'payload' ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 max-h-48 overflow-y-auto">
                    <pre className="text-xs font-mono text-emerald-300 whitespace-pre-wrap">
                      {selectedResult.responseBody}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Simulated Server Endpoints Configuration Tab */}
      {activeSubTab === 'server_config' && (
        <div className="p-6 rounded-xl bg-cyber-card border border-cyber-border space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Simulated Flask Server Endpoints</h3>
              <p className="text-xs text-slate-400 mt-1">
                Configures the mock responses returned when testing against <code className="text-emerald-400 font-mono">http://localhost:8080/api/{'{word}'}</code> (mirrors <code className="text-slate-300 font-mono">server.py</code>).
              </p>
            </div>
            <button
              onClick={() => {
                const newWord = prompt('Enter new endpoint word (e.g. secret, api, status):');
                if (newWord) {
                  setMockEndpoints(prev => [
                    ...prev,
                    { word: newWord.trim().toLowerCase(), status: 200, response: { message: "Custom endpoint discovered!", word: newWord } }
                  ]);
                }
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Endpoint</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockEndpoints.map((ep, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-bold text-emerald-400">/api/{ep.word}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      ep.status === 200 ? 'bg-emerald-500/20 text-emerald-300' : ep.status === 403 ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      HTTP {ep.status}
                    </span>
                  </div>
                  {ep.word !== 'test' && (
                    <button
                      onClick={() => setMockEndpoints(prev => prev.filter((_, i) => i !== idx))}
                      className="text-slate-500 hover:text-red-400 transition"
                      title="Remove endpoint"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                  <pre>{JSON.stringify(ep.response, null, 2)}</pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Python Source Code Tab */}
      {activeSubTab === 'python_code' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* server.py */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-200">API Fuzzer/server.py</span>
              <button
                onClick={() => copyToClipboard(`from flask import Flask, jsonify

app = Flask(__name__)

# Example API route
@app.route('/api/<word>', methods=['GET'])
def api(word):
    if word == "test":
        return jsonify({"message": "Success!", "word": word}), 200
    else:
        return jsonify({"error": "Not found"}), 404

if __name__ == "__main__":
    # Run the server on port 8080
    app.run(host="0.0.0.0", port=8080)
`, 'server')}
                className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200"
              >
                {copiedCode === 'server' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode === 'server' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`from flask import Flask, jsonify

app = Flask(__name__)

# Example API route
@app.route('/api/<word>', methods=['GET'])
def api(word):
    if word == "test":
        return jsonify({"message": "Success!", "word": word}), 200
    else:
        return jsonify({"error": "Not found"}), 404

if __name__ == "__main__":
    # Run the server on port 8080
    app.run(host="0.0.0.0", port=8080)`}
            </pre>
          </div>

          {/* main.py */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-200">API Fuzzer/main.py</span>
              <button
                onClick={() => copyToClipboard(`import requests
import sys

def loop():
    for word in sys.stdin:
        word = word.strip()
        if not word:
            continue
        
        try:
            res = requests.get(url=f"http://localhost:8080/api/{word}")

            if res.status_code == 404:
                print(f"[404] Not found: {word}")
            else:
                data = res.json()
                print(f"[{res.status_code}] Found: {word}")
                print(data)

        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")

loop()
`, 'main')}
                className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200"
              >
                {copiedCode === 'main' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode === 'main' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`import requests
import sys

def loop():
    for word in sys.stdin:
        word = word.strip()
        if not word:
            continue
        
        try:
            res = requests.get(url=f"http://localhost:8080/api/{word}")

            if res.status_code == 404:
                print(f"[404] Not found: {word}")
            else:
                data = res.json()
                print(f"[{res.status_code}] Found: {word}")
                print(data)

        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")

loop()`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
