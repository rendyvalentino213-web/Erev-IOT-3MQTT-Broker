import React, { useState, useEffect, useRef } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import Dashboard from './Dashboard';
import { Zap, Wifi, WifiOff, Loader2, Server, Mic, MicOff } from 'lucide-react';

interface BrokerConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: 'wss' | 'ws';
  path: string;
  clientId: string;
  username?: string;
  password?: string;
}

const randomString = Math.random().toString(16).slice(2, 8);
const MYQTTHUB_CONFIG: BrokerConfig = {
  id: 'myqtthub',
  name: 'MyQttHub',
  host: 'node02.myqtthub.com',
  port: 443,
  protocol: 'wss',
  path: `/?clientId=web_${randomString}`,
  clientId: `web_${randomString}`,
  username: 'rendy13', // Jika gagal, coba format domain\username
  password: '123'
};

export interface LogEntry {
  id: number;
  time: Date;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

export default function MqttApp() {
  const [draftConfig, setDraftConfig] = useState<BrokerConfig>(MYQTTHUB_CONFIG);
  const [activeConfig, setActiveConfig] = useState<BrokerConfig>(MYQTTHUB_CONFIG);
  const [showConfig, setShowConfig] = useState(false);
  const [client, setClient] = useState<MqttClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isForceDisconnected, setIsForceDisconnected] = useState(false);

  // Voice Command states
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [speechRecEnabled, setSpeechRecEnabled] = useState(true);

  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [{ id: Date.now(), time: new Date(), message, type }, ...prev].slice(0, 50));
  };

  // States for Sensor Data
  const [suhu, setSuhu] = useState<string>('--');
  const [kelembaban, setKelembaban] = useState<string>('--');

  // States for Relays
  const [relays, setRelays] = useState<Record<string, boolean>>({
    relay1: false,
    relay2: false,
    relay3: false,
    relay4: false,
    variasi1: false,
    variasi2: false,
  });

  useEffect(() => {
    if (client) {
      client.end(true); // cleanup old client when switching broker
      setClient(null);
    }

    if (isForceDisconnected) {
      setIsConnected(false);
      setIsConnecting(false);
      return;
    }

    const { host, port, protocol, path, clientId, username, password, name } = activeConfig;

    let url = '';
    
    if (activeConfig.id === 'myqtthub') {
      // Menggunakan backend proxy (Express) untuk meneruskan WebSocket ke TCP murni MyQttHub port 1883
      const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      url = `${wsProtocol}://${window.location.host}/mqtt-proxy`;
    } else {
      let cleanPath = (path && path.trim() !== '') ? (path.startsWith('/') ? path : `/${path}`) : '';
      url = `${protocol}://${host}:${port}${cleanPath}`;
    }

    const options: mqtt.IClientOptions = {
      protocol: activeConfig.id === 'myqtthub' ? (window.location.protocol === 'https:' ? 'wss' : 'ws') : (protocol === 'wss' ? 'wss' : 'ws'),
      clientId,
      username,
      ...(password ? { password } : {}),
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 10 * 1000,
      protocolVersion: 4, // MQTT 3.1.1
    };

    setIsConnecting(true);
    setConnectionError(null);
    addLog(`Menghubungkan ke ${name} (${host})...`, 'info');

    const mqttClient = mqtt.connect(url, options);

    mqttClient.on('connect', () => {
      console.log('Connected to MQTT Broker!');
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
      setClient(mqttClient);
      addLog(`Berhasil terhubung ke ${name}`, 'success');

      // Subscribe to sensor topics
      mqttClient.subscribe('sensor/suhu');
      mqttClient.subscribe('sensor/kelembaban');
    });

    mqttClient.on('message', (topic, message) => {
      const payload = message.toString();

      if (topic === 'sensor/suhu') {
        const changed = suhu !== payload;
        setSuhu(payload);
      } else if (topic === 'sensor/kelembaban') {
        setKelembaban(payload);
      } else if (topic.startsWith('kontrol/relay')) {
        // Option to listen incoming relays state
      }
    });

    mqttClient.on('error', (err) => {
      console.error('MQTT Connection Error:', err);
      setConnectionError(`Connection Error: ${err.message}`);
      setIsConnecting(false);
      addLog(`Gagal terhubung: ${err.message}`, 'error');
    });

    mqttClient.on('close', () => {
      console.log('MQTT Connection closed');
      setIsConnected(false);
      setIsConnecting(false);
      // setConnectionError('Terputus dari Broker. Mencoba menghubungkan kembali...');
      addLog(`Koneksi ke ${name} terputus`, 'warn');
    });

    return () => {
      mqttClient.end();
    };
  }, [activeConfig, isForceDisconnected]);

  const publishRelay = (relayId: string, state: boolean) => {
    if (client && isConnected) {
      const topic = `kontrol/${relayId}`;
      const payload = state ? 'ON' : 'OFF';
      client.publish(topic, payload);
      
      // Optimitistic update
      setRelays(prev => ({ ...prev, [relayId]: state }));
      addLog(`Mengirim instruksi ${payload} ke ${relayId}`, 'info');
    } else {
      addLog("Gagal mengirim aksi: Belum terhubung ke Broker", 'error');
      alert("Belum terhubung ke MQTT Broker");
    }
  };

  const publishRelayRef = useRef(publishRelay);
  const addLogRef = useRef(addLog);

  useEffect(() => {
    publishRelayRef.current = publishRelay;
    addLogRef.current = addLog;
  });

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechRecEnabled(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'id-ID';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let timeoutId: any;

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript.toLowerCase();
      setVoiceText(text);
      let matched = false;

      const triggerCommand = (target: string, act: boolean) => {
          publishRelayRef.current(target, act);
          matched = true;
      };

      if (text.includes("nyalakan relay satu") || text.includes("nyalakan relay 1") || text.includes("hidupkan relay 1")) triggerCommand('relay1', true);
      else if (text.includes("matikan relay satu") || text.includes("matikan relay 1")) triggerCommand('relay1', false);
      else if (text.includes("nyalakan relay dua") || text.includes("nyalakan relay 2") || text.includes("hidupkan relay 2")) triggerCommand('relay2', true);
      else if (text.includes("matikan relay dua") || text.includes("matikan relay 2")) triggerCommand('relay2', false);
      else if (text.includes("nyalakan relay tiga") || text.includes("nyalakan relay 3") || text.includes("hidupkan relay 3")) triggerCommand('relay3', true);
      else if (text.includes("matikan relay tiga") || text.includes("matikan relay 3")) triggerCommand('relay3', false);
      else if (text.includes("nyalakan relay empat") || text.includes("nyalakan relay 4") || text.includes("hidupkan relay 4")) triggerCommand('relay4', true);
      else if (text.includes("matikan relay empat") || text.includes("matikan relay 4")) triggerCommand('relay4', false);
      else if (text.includes("nyalakan variasi satu") || text.includes("nyalakan variasi 1") || text.includes("hidupkan variasi 1")) triggerCommand('variasi1', true);
      else if (text.includes("matikan variasi satu") || text.includes("matikan variasi 1")) triggerCommand('variasi1', false);
      else if (text.includes("nyalakan variasi dua") || text.includes("nyalakan variasi 2") || text.includes("hidupkan variasi 2")) triggerCommand('variasi2', true);
      else if (text.includes("matikan variasi dua") || text.includes("matikan variasi 2")) triggerCommand('variasi2', false);

      if (matched) {
        addLogRef.current(`Voice Command dikenali: "${text}"`, 'success');
      } else {
        addLogRef.current(`Voice Command tidak dikenali: "${text}"`, 'warn');
      }

      timeoutId = setTimeout(() => setVoiceText(''), 3000);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      setVoiceText(`Error: ${event.error}`);
      addLogRef.current(`Error Voice Command: ${event.error}`, 'error');
    };

    recognition.onend = () => setIsListening(false);

    (window as any).handleVoiceCommand = () => {
      if (isListening) {
        recognition.stop();
        setIsListening(false);
        addLogRef.current("Voice Command dihentikan", 'info');
      } else {
        clearTimeout(timeoutId);
        setVoiceText('Mendengarkan...');
        try {
          recognition.start();
          setIsListening(true);
          addLogRef.current("Mulai mendengarkan Voice Command...", 'info');
        } catch (e) {}
      }
    };

    return () => {
      recognition.abort();
      delete (window as any).handleVoiceCommand;
    };
  }, [isListening]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="bg-black text-white py-4 px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between shadow-md gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#F55E5E] p-2 rounded-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">IoT Dashboard ESP32</h1>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg text-sm text-white">
            <Server className="w-4 h-4 text-slate-400" />
            <span className="font-medium">MyQttHub</span>
          </div>

          <button 
            onClick={() => setShowConfig(!showConfig)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${showConfig ? 'bg-white/20 border-white/40 text-white' : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'}`}
          >
            Pengaturan
          </button>

          <button 
            onClick={() => {
              if (isConnected || isConnecting) {
                setIsForceDisconnected(true);
                addLog('Koneksi diputus oleh pengguna', 'warn');
              } else {
                setIsForceDisconnected(false);
                setActiveConfig({...draftConfig}); // trigger reconnect
              }
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${
              (isConnected || isConnecting) 
              ? 'bg-red-500/20 hover:bg-red-500/30 border-red-500/40 text-red-200' 
              : 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 text-emerald-200'
            }`}
          >
            {(isConnected || isConnecting) ? 'Putuskan' : 'Hubungkan'}
          </button>

          <div>
            {isConnecting ? (
              <div className="flex items-center gap-2 text-yellow-400 bg-white/10 px-3 py-2 rounded-lg text-sm font-medium w-[120px] justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                Wait...
              </div>
            ) : isConnected ? (
              <div className="flex items-center gap-2 text-emerald-400 bg-white/10 px-3 py-2 rounded-lg text-sm font-medium w-[120px] justify-center">
                <Wifi className="w-4 h-4" />
                Online
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[#F55E5E] bg-white/10 px-3 py-2 rounded-lg text-sm font-medium w-[120px] justify-center">
                <WifiOff className="w-4 h-4" />
                Offline
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Show connection error alert if completely disconnected and have error text */}
      {!isConnected && !isConnecting && connectionError && (
        <div className="bg-red-50 p-4 border-b border-red-100">
          <p className="text-sm text-red-600 text-center">{connectionError}</p>
        </div>
      )}

      <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row gap-6">
        <div className="flex-1 flex flex-col gap-6">
          {draftConfig.id === 'myqtthub' && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-sm text-blue-700 animate-in fade-in duration-300">
              <strong>Info Sistem:</strong> Web ini menggunakan <b>Backend Proxy</b> untuk menghubungkan WebSocket browser Anda ke MyQttHub menggunakan protokol <b>TCP Murni (Port 1883)</b> karena MyQttHub versi publik tidak mendukung koneksi aman WSS dari browser.
            </div>
          )}

          {showConfig && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in slide-in-from-top-4 duration-300">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Pengaturan Koneksi MQTT</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Server Host</label>
                  <input 
                    type="text" 
                    value={draftConfig.host}
                    onChange={(e) => setDraftConfig({...draftConfig, host: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F55E5E]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Port & Protocol</label>
                  <select
                    value={`${draftConfig.protocol}:${draftConfig.port}`}
                    onChange={(e) => {
                      const [prot, prt] = e.target.value.split(':');
                      setDraftConfig({...draftConfig, protocol: prot as any, port: Number(prt)});
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F55E5E] bg-white cursor-pointer"
                  >
                    <option value="wss:443">wss:// (Secure) - Port 443</option>
                    <option value="wss:8084">wss:// (Secure) - Port 8084</option>
                    <option value="ws:80">ws:// (Unsecure) - Port 80</option>
                    <option value="ws:8080">ws:// (Unsecure) - Port 8080</option>
                    <option value="ws:8083">ws:// (Unsecure) - Port 8083</option>
                    <option value="ws:1883">ws:// (TCP Mapping) - Port 1883</option>
                    {![443, 8084, 80, 8080, 8083, 1883].includes(draftConfig.port) && (
                      <option value={`${draftConfig.protocol}:${draftConfig.port}`}>
                        {draftConfig.protocol}:// (Custom) - Port {draftConfig.port}
                      </option>
                    )}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                    WSS: <b>443</b> / <b>8084</b>. WS: <b>8080</b> / <b>80</b>.<br />
                    <span className="text-red-500 font-medium">Platform Web ini wajib menggunakan WSS (karena HTTPS). MyQttHub secara default mungkin hanya mendukung 'ws://' port 8080.</span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Client ID</label>
                  <input 
                    type="text" 
                    value={draftConfig.clientId}
                    onChange={(e) => setDraftConfig({...draftConfig, clientId: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F55E5E]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                  <input 
                    type="text" 
                    value={draftConfig.username || ''}
                    onChange={(e) => setDraftConfig({...draftConfig, username: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F55E5E]"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Format MyQttHub: <span className="font-mono bg-slate-100 px-1 rounded">domain\username</span> atau hanya username.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password (opsional)</label>
                  <input 
                    type="password" 
                    value={draftConfig.password || ''}
                    onChange={(e) => setDraftConfig({...draftConfig, password: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F55E5E]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Path</label>
                  <input 
                    type="text" 
                    value={draftConfig.path}
                    onChange={(e) => setDraftConfig({...draftConfig, path: e.target.value})}
                    placeholder="e.g. / or /?clientId=..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F55E5E]"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 italic">
                    Default: <b>/</b>. Jika web ditolak (Connection Refused), coba: <br/><b>/?clientId=webrendy1</b>
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button 
                  onClick={() => {
                     setDraftConfig(activeConfig);
                     setShowConfig(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                >
                  Batal
                </button>
                <button 
                  onClick={() => {
                    setActiveConfig(draftConfig);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#F55E5E] hover:bg-[#E04949] rounded-lg transition-colors shadow-sm"
                >
                  Terapkan & Hubungkan
                </button>
              </div>
            </div>
          )}

          <Dashboard 
            suhu={suhu} 
            kelembaban={kelembaban} 
            relays={relays} 
            onToggleRelay={publishRelay}
            addLog={addLog}
            voiceText={voiceText}
            isListening={isListening}
            speechRecEnabled={speechRecEnabled}
            onToggleVoiceCommand={() => (window as any).handleVoiceCommand && (window as any).handleVoiceCommand()}
          />
        </div>
        <div className="w-full md:w-80 flex-shrink-0 flex flex-col gap-6">
           {/* Log Aktifitas */}
           <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 flex-1 flex flex-col overflow-hidden max-h-[800px] text-slate-300">
             <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
               <h3 className="font-semibold text-slate-100">Log Aktifitas</h3>
               {logs.length > 0 && (
                 <button onClick={() => setLogs([])} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                   Hapus
                 </button>
               )}
             </div>
             <div className="p-4 flex-1 overflow-y-auto space-y-3">
                {logs.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center italic mt-10">Belum ada aktifitas</p>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className="flex gap-3 text-sm">
                      <div className="text-xs text-slate-500 whitespace-nowrap pt-0.5 mt-0.5">
                        {log.time.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                      </div>
                      <div className={`
                        flex-1 
                        ${log.type === 'error' ? 'text-red-400' : ''}
                        ${log.type === 'warn' ? 'text-yellow-400' : ''}
                        ${log.type === 'success' ? 'text-emerald-400' : ''}
                        ${log.type === 'info' ? 'text-slate-300' : ''}
                      `}>
                        {log.message}
                      </div>
                    </div>
                  ))
                )}
             </div>
           </div>
        </div>
      </main>
    </div>
  );
}
