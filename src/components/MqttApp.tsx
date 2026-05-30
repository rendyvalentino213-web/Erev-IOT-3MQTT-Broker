import React, { useState, useEffect, useRef } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import Dashboard from './Dashboard';
import { Zap, Wifi, WifiOff, Loader2, Server, Mic, MicOff, Cpu, Eye, EyeOff } from 'lucide-react';

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
  connectionMode?: 'proxy' | 'direct';
}

const randomString = Math.random().toString(16).slice(2, 8);
const MYQTTHUB_CONFIG: BrokerConfig = {
  id: 'myqtthub',
  name: 'MyQttHub',
  host: 'node02.myqtthub.com',
  port: 8084,
  protocol: 'wss',
  path: `/?clientId=webrendy1`,
  clientId: `webrendy1`,
  username: 'rendy13',
  password: '123',
  connectionMode: 'direct'
};

const CEDALO_CONFIG: BrokerConfig = {
  id: 'cedalo',
  name: 'Cedalo',
  host: 'pf-vq054sbd1b6o85trjdj0.cedalo.cloud',
  port: 443,
  protocol: 'wss',
  path: '/mqtt',
  clientId: `rendyweb_${Math.random().toString(16).slice(2, 6)}`,
  username: 'webrendy1',
  password: '123',
  connectionMode: 'direct'
};

const ABLY_CONFIG: BrokerConfig = {
  id: 'ably',
  name: 'Ably',
  host: 'mqtt.ably.io',
  port: 443,
  protocol: 'wss',
  path: '/',
  clientId: `rendyweb_ably_${Math.random().toString(16).slice(2, 8)}`,
  username: 'saCuRw.TlY75w',
  password: 'EZffxoslAB9Xy81X0--ZKJ05Nk326crWVGKAaRGLfe8',
  connectionMode: 'direct'
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
  const [client, setClient] = useState<MqttClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isForceDisconnected, setIsForceDisconnected] = useState(true);

  // Voice Command states
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [speechRecEnabled, setSpeechRecEnabled] = useState(true);

  // Settings visibility and Dismissable System Info states
  const [isSettingsVisible, setIsSettingsVisible] = useState(true);
  const [isSystemInfoDismissed, setIsSystemInfoDismissed] = useState(false);

  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [{ id: Date.now() + Math.random(), time: new Date(), message, type }, ...prev].slice(0, 50));
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

  const [variationSpeed, setVariationSpeed] = useState<number>(200);
  const [lastSensorTime, setLastSensorTime] = useState<number>(0);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 2000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isForceDisconnected) {
      setIsConnected(false);
      setIsConnecting(false);
      return;
    }

    const { host, port, protocol, path, clientId, username, password, name, connectionMode, id } = activeConfig;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    
    // Setup robust logic for when to use the proxy
    const useProxy = connectionMode === 'proxy' || 
                      port === 1883 || 
                      (protocol === 'ws' && window.location.protocol === 'https:');

    // Target port on the broker side for the proxy bridge is exactly the active configuration port
    const targetPort = port;

    let url = '';
    if (useProxy) {
     // Gunakan domain Backend proxy dari Railway Anda yang baru dideploy
      url = `erev-iot-3mqtt-broker-production.up.railway.app-proxy?host=${host}&port=${targetPort}`;
    } else {
      let cleanPath = (path && path.trim() !== '') ? (path.startsWith('/') ? path : `/${path}`) : '';
      url = `${protocol}://${host}:${port}${cleanPath}`;
    }

    const options: mqtt.IClientOptions = {
      clientId,
      username,
      ...(password ? { password } : {}),
      clean: true,
      reconnectPeriod: 4000, // Reconnect period of 4s to handle brief packet drops gracefully
      connectTimeout: 15 * 1000,
      protocolVersion: 4, // MQTT 3.1.1
    };

    // Explicitly seed protocol/host/port/path in options for browser bundle stability
    if (useProxy) {
      options.protocol = wsProtocol as any;
      options.host = window.location.hostname;
      options.port = window.location.port ? Number(window.location.port) : (wsProtocol === 'wss' ? 443 : 80);
      options.path = `/mqtt-proxy?host=${host}&port=${targetPort}`;
    } else {
      options.protocol = (protocol === 'wss' ? 'wss' : 'ws') as any;
      options.host = host;
      options.port = port;
      options.path = (path && path.trim() !== '') ? (path.startsWith('/') ? path : `/${path}`) : undefined;
    }

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

      // Subscribe to sensor and control wildcard topics for maximum performance and reliability on Ably and Cedalo
      mqttClient.subscribe('sensor/+');
      mqttClient.subscribe('kontrol/+');
      mqttClient.subscribe('status/+');

      // Clear any stale retained messages for broker control to prevent infinite broker hopping loops
      mqttClient.publish('kontrol/broker', '', { qos: 1, retain: true });

      // Sync ESP32: publish active broker target key so it immediately connects or switches
      let targetPayload = '1';
      if (id === 'cedalo') targetPayload = '2';
      else if (id === 'ably') targetPayload = '3';
      
      setTimeout(() => {
        if (mqttClient.connected) {
          mqttClient.publish('kontrol/broker', targetPayload, { qos: 1, retain: false });
          addLog(`Sinkronisasi aktif: Mengirim sinyal "${targetPayload}" ke ESP32 agar terhubung`, 'info');
        }
      }, 300);
    });

    mqttClient.on('message', (topic, message) => {
      const payload = message.toString();

      if (topic === 'status/broker') {
        addLog(`[ESP32 Status]: ESP32 melaporkan terhubung ke > ${payload}`, 'success');
      }

      if (topic.startsWith('sensor/')) {
        setLastSensorTime(Date.now());
      }

      if (topic === 'sensor/suhu') {
        const changed = suhu !== payload;
        setSuhu(payload);
      } else if (topic === 'sensor/kelembaban') {
        setKelembaban(payload);
      } else if (topic === 'kontrol/speed') {
        const speedVal = Number(payload);
        if (!isNaN(speedVal) && speedVal > 0) {
          setVariationSpeed(speedVal);
        }
      } else if (topic.startsWith('kontrol/')) {
        const relayId = topic.split('/')[1];
        setRelays(prev => {
          if (relayId in prev) {
            return { ...prev, [relayId]: payload === 'ON' };
          }
          return prev;
        });
      }
    });

    mqttClient.on('error', (err: any) => {
      console.error('MQTT Connection Error:', err);
      // Construct an Arduino IDE style detailed error message
      const errorCode = err.code ? `[Error Code: ${err.code}] ` : '[Connection Failed] ';
      const errorMsg = err.message || 'Websocket connection failed or connection refused by broker.';
      const detailError = `${errorCode}${errorMsg}`;
      
      setConnectionError(detailError);
      setIsConnecting(false);
      addLog(`FATAL ERROR: ${detailError}`, 'error');
    });

    mqttClient.on('close', () => {
      console.log('MQTT Connection closed');
      setIsConnected(false);
      setIsConnecting(false);
      addLog(`[System] Koneksi ke ${name} tertutup/terputus.`, 'warn');
    });

    mqttClient.on('offline', () => {
      addLog(`[System] Koneksi ke broker ${name} offline.`, 'warn');
    });

    return () => {
      mqttClient.end(true);
      setClient(null);
    };
  }, [activeConfig, isForceDisconnected]);

  const publishRelay = (relayId: string, state: boolean) => {
    if (client && isConnected) {
      const topic = `kontrol/${relayId}`;
      const payload = state ? 'ON' : 'OFF';
      client.publish(topic, payload, { qos: 1 });
      
      // Optimistic update
      setRelays(prev => {
        const next = { ...prev, [relayId]: state };
        
        // If turning on Variasi 1, ensure Variasi 2 is turned off
        if (relayId === 'variasi1' && state) {
          if (prev.variasi2) {
            next.variasi2 = false;
            client.publish('kontrol/variasi2', 'OFF', { qos: 1 });
            addLog('Mengirim instruksi OFF ke variasi2', 'info');
          }
        } 
        // If turning on Variasi 2, ensure Variasi 1 is turned off
        else if (relayId === 'variasi2' && state) {
          if (prev.variasi1) {
            next.variasi1 = false;
            client.publish('kontrol/variasi1', 'OFF', { qos: 1 });
            addLog('Mengirim instruksi OFF ke variasi1', 'info');
          }
        }
        
        return next;
      });
      addLog(`Mengirim instruksi ${payload} ke ${relayId}`, 'info');
    } else {
      addLog("Gagal mengirim aksi: Belum terhubung ke Broker", 'error');
      alert("Belum terhubung ke MQTT Broker");
    }
  };

  const publishBrokerCommand = (targetBrokerId: string) => {
    if (client && isConnected) {
      const topic = 'kontrol/broker';
      let payload = '1';
      if (targetBrokerId === 'cedalo') payload = '2';
      else if (targetBrokerId === 'ably') payload = '3';

      client.publish(topic, payload, { qos: 1, retain: false }, (err) => {
        if (!err) {
          addLog(`Mengirim instruksi ganti broker ke ESP32: "${payload}"`, 'success');
        } else {
          addLog(`Gagal mengirim instruksi ganti broker: ${err.message}`, 'error');
        }
      });
    } else {
      addLog("Gagal mengirim komando: Browser belum terhubung ke broker aktif saat ini.", 'error');
      alert("Browser belum terhubung ke MQTT Broker. Silakan hubungkan terlebih dahulu untuk mengirim perintah ganti broker!");
    }
  };

  const handleStopAll = () => {
    if (client && isConnected) {
      // Find what is actually ON under the current conditions
      const activeKeys = Object.keys(relays).filter(key => relays[key]);

      if (activeKeys.length > 0) {
        activeKeys.forEach(relayId => {
          client.publish(`kontrol/${relayId}`, 'OFF', { qos: 1 });
          addLog(`Mengirim instruksi OFF ke ${relayId}`, 'info');
        });
      }

      setRelays({
        relay1: false,
        relay2: false,
        relay3: false,
        relay4: false,
        variasi1: false,
        variasi2: false,
      });

      addLog('Semua relay & variasi dimatikan (STOP)', 'warn');
    } else {
      addLog("Gagal mengirim aksi: Belum terhubung ke Broker", 'error');
      alert("Belum terhubung ke MQTT Broker");
    }
  };

  const handleVariationSpeedChange = (speed: number) => {
    setVariationSpeed(speed);
    if (client && isConnected) {
      client.publish('kontrol/speed', String(speed), { qos: 1 });
      addLog(`Mengirim instruksi KECEPATAN: ${speed}ms`, 'info');
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

  const settingsPanel = (
    <div 
      id="mqtt-settings" 
      className="w-full bg-white p-5 rounded-2xl shadow-sm border border-slate-200 transition-all duration-300 flex flex-col animate-in slide-in-from-left-4 duration-300 mb-6"
    >
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Server className="w-5 h-5 text-[#F55E5E]" />
          <h2 className="text-base font-bold text-slate-800">Pengaturan Broker MQTT</h2>
        </div>
        <button
          onClick={() => {
            setIsSettingsVisible(false);
            addLog('Pengaturan Broker disembunyikan', 'info');
          }}
          className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Sembunyikan Pengaturan"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    
    <div className="space-y-4 text-left">
      {/* Row 1: Pilih Broker, Metode Koneksi & Path/Topics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1.5 text-left">Pilih Broker</label>
          <select
            value={draftConfig.id}
            onChange={(e) => {
              if (e.target.value === 'myqtthub') {
                setDraftConfig({...MYQTTHUB_CONFIG});
                setIsSystemInfoDismissed(false);
              } else if (e.target.value === 'cedalo') {
                setDraftConfig({...CEDALO_CONFIG});
                setIsSystemInfoDismissed(false);
              } else if (e.target.value === 'ably') {
                setDraftConfig({...ABLY_CONFIG});
                setIsSystemInfoDismissed(false);
              }
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F55E5E] bg-slate-50 cursor-pointer text-slate-700 h-[38px]"
          >
            <option value="myqtthub">MyQttHub</option>
            <option value="cedalo">Cedalo</option>
            <option value="ably">Ably</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1.5 text-left">Metode Koneksi</label>
          <select
            value={draftConfig.connectionMode || 'direct'}
            onChange={(e) => {
              const mode = e.target.value as 'proxy' | 'direct';
              const updated = { ...draftConfig, connectionMode: mode };
              if (mode === 'proxy') {
                updated.protocol = 'ws';
                updated.port = 1883; // Standard unencrypted TCP port bridged by our WebSocket proxy for all brokers
                updated.path = draftConfig.id === 'myqtthub' ? `/?clientId=${draftConfig.clientId || 'webrendy1'}` : '';
              } else {
                updated.protocol = 'wss';
                updated.port = draftConfig.id === 'myqtthub' ? 8084 : 443;
                updated.path = draftConfig.id === 'cedalo' ? '/mqtt' : (draftConfig.id === 'ably' ? '/' : `/?clientId=${draftConfig.clientId || 'webrendy1'}`);
              }
              setDraftConfig(updated);
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F55E5E] bg-white cursor-pointer text-slate-700 h-[38px]"
          >
            <option value="proxy">Opsi 1: Proxy Backend (TCP - Port 1883/8883)</option>
            <option value="direct">Opsi 2: WebSocket Langsung (WSS - Port 443)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1.5 text-left">Path / Topics (Optional)</label>
          <input 
            type="text" 
            value={draftConfig.path}
            onChange={(e) => setDraftConfig({...draftConfig, path: e.target.value})}
            placeholder="Contoh: /mqtt"
            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#F55E5E] h-[38px]"
          />
        </div>
      </div>

      {/* Row 2: Server Host & Port/Protocol dibawahnya */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1.5 text-left">Server Host</label>
          <input 
            type="text" 
            value={draftConfig.host}
            onChange={(e) => setDraftConfig({...draftConfig, host: e.target.value})}
            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F55E5E] h-[38px]"
          />
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1.5 text-left">Port & Protocol</label>
          <select
            value={`${draftConfig.protocol}:${draftConfig.port}`}
            onChange={(e) => {
              const [prot, prt] = e.target.value.split(':');
              setDraftConfig({...draftConfig, protocol: prot as any, port: Number(prt)});
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F55E5E] bg-white cursor-pointer text-slate-700 h-[38px]"
          >
            <option value="wss:443">wss:// (Secure Container) - port 443</option>
            <option value="wss:8883">wss:// (Secure TLS/SSL) - port 8883</option>
            <option value="wss:8084">wss:// (Secure WebSockets) - port 8084</option>
            <option value="wss:8091">wss:// (Secure WebSockets) - port 8091</option>
            <option value="ws:80">ws:// (Unsecure) - port 80</option>
            <option value="ws:8080">ws:// (Unsecure WebSockets) - port 8080</option>
            <option value="ws:8083">ws:// (Unsecure WebSockets) - port 8083</option>
            <option value="ws:1883">ws:// (TCP Proxy) - port 1883</option>
            {![443, 8883, 8084, 8091, 80, 8080, 8083, 1883].includes(draftConfig.port) && (
              <option value={`${draftConfig.protocol}:${draftConfig.port}`}>
                {draftConfig.protocol}:// (Custom) - Port {draftConfig.port}
              </option>
            )}
          </select>
        </div>
      </div>

      {/* Row 3: Client ID, Username & Password */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1.5 text-left">Client ID</label>
          <input 
            type="text" 
            value={draftConfig.clientId}
            onChange={(e) => setDraftConfig({...draftConfig, clientId: e.target.value})}
            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#F55E5E] h-[38px]"
          />
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1.5 text-left">Username</label>
          <input 
            type="text" 
            value={draftConfig.username || ''}
            onChange={(e) => setDraftConfig({...draftConfig, username: e.target.value})}
            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F55E5E] h-[38px]"
          />
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1.5 text-left">Password</label>
          <input 
            type="password" 
            value={draftConfig.password || ''}
            onChange={(e) => setDraftConfig({...draftConfig, password: e.target.value})}
            placeholder="Opsional"
            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#F55E5E] h-[38px]"
          />
        </div>
      </div>
    </div>

    <div className="pt-4 mt-4 border-t border-slate-100 flex-shrink-0 bg-white shadow-sm rounded-b-xl">
      <button 
        onClick={() => {
          if (isConnected && client && draftConfig.id !== activeConfig.id) {
            // Signal ESP32 first
            let payload = '1';
            if (draftConfig.id === 'cedalo') payload = '2';
            else if (draftConfig.id === 'ably') payload = '3';

            addLog(`Mengalihkan ESP32 ke broker ${draftConfig.name.toUpperCase()} secara otomatis...`, 'info');
            client.publish('kontrol/broker', payload, { qos: 1, retain: false }, (err) => {
              if (err) {
                addLog(`Gagal mengirim sinyal ke ESP32: ${err.message}`, 'error');
              } else {
                addLog(`Sinyal beralih "${payload}" terkirim ke ESP32`, 'success');
              }
              // Wait 300ms then transition active browser configuration
              setTimeout(() => {
                setActiveConfig({...draftConfig});
                setIsForceDisconnected(false);
              }, 300);
            });
          } else {
            setActiveConfig({...draftConfig});
            setIsForceDisconnected(false);
          }
        }}
        className="w-full px-4 py-3 text-xs sm:text-sm font-bold text-white bg-[#F55E5E] hover:bg-[#E04949] rounded-xl transition-all shadow-md shadow-red-500/10 flex items-center justify-center gap-2 cursor-pointer duration-200 active:scale-95"
      >
        ⚡ Hubungkan Browser
      </button>
    </div>
  </div>
);

  const handleConnectToggle = () => {
    if (isConnected || isConnecting) {
      if (client && isConnected) {
        addLog('Mengirim sinyal putuskan koneksi ke broker untuk ESP32...', 'info');
        // Publish 'disconnect' with QoS 1
        client.publish('kontrol/broker', 'disconnect', { qos: 1, retain: false }, () => {
          // Wait 300ms to allow publish flush before terminating socket
          setTimeout(() => {
            setIsForceDisconnected(true);
            addLog('Koneksi browser diputus.', 'warn');
          }, 300);
        });
      } else {
        setIsForceDisconnected(true);
        addLog('Koneksi diputus oleh pengguna', 'warn');
      }
    } else {
      setIsForceDisconnected(false);
      setActiveConfig({...draftConfig}); // trigger reconnect
    }
  };

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans transition-colors duration-300">
        
        {/* Floating background decorations */}
        <div className="absolute top-0 left-0 w-full h-[320px] bg-gradient-to-b from-[#F55E5E]/5 to-transparent pointer-events-none -z-10"></div>
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-400/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-400/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
  
        <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-md">
          <div className="max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-4">
            
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-tr from-[#F55E5E] to-[#FF8E8E] flex items-center justify-center shadow-lg shadow-red-500/30">
                <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  IoT CONTROL CENTER
                  <span className="text-[9px] font-bold bg-white/10 px-2 py-0.5 rounded-full text-slate-300 border border-white/5 uppercase select-none tracking-wider">
                    v1.0.4
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Monitoring Suhu, Kelembaban dan Switch Relay</p>
              </div>
            </div>
  
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Show/Hide Settings Toggle */}
              <button
                onClick={() => {
                  const state = !isSettingsVisible;
                  setIsSettingsVisible(state);
                  addLog(state ? 'Pengaturan Broker ditampilkan' : 'Pengaturan Broker disembunyikan', 'info');
                }}
                className={`px-4 py-2 text-xs sm:text-sm rounded-lg font-medium border transition-all flex items-center gap-2 flex-1 sm:flex-none justify-center cursor-pointer ${
                  isSettingsVisible 
                  ? 'bg-slate-800 border-slate-700 text-white shadow-inner' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {isSettingsVisible ? (
                  <>
                    <EyeOff className="w-4 h-4" /> Broker Settings
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" /> Broker Settings
                  </>
                )}
              </button>

              <button
                disabled={isConnecting}
                onClick={handleConnectToggle}
                className={`px-4 py-2 text-xs sm:text-sm rounded-lg font-bold border transition-all flex-1 sm:flex-none cursor-pointer duration-200 ${
                  (isConnected || isConnecting) 
                  ? 'bg-red-500/20 hover:bg-red-500/30 border-red-500/40 text-red-200' 
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 text-emerald-200'
                }`}
              >
                {(isConnected || isConnecting) ? 'Putuskan' : 'Hubungkan'}
              </button>
  
              <div className="flex-1 sm:flex-none">
                {isConnecting ? (
                  <div className="flex items-center gap-2 text-yellow-400 bg-white/10 px-4 h-10 rounded-lg text-xs sm:text-sm font-medium px-4 h-10 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sinkronisasi {activeConfig.name}...
                  </div>
                ) : isConnected ? (
                  <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 h-10 rounded-lg text-xs sm:text-sm font-black justify-center">
                    <Wifi className="w-4 h-4 text-emerald-400" />
                    Hubung: {activeConfig.name}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 h-10 rounded-lg text-xs sm:text-sm font-bold justify-center">
                    <WifiOff className="w-4 h-4 text-rose-400" />
                    Putus: {activeConfig.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
  
        {/* Show connection error alert if completely disconnected and have error text */}
        {!isConnected && !isConnecting && connectionError && (
          <div className="bg-black p-4 border-b border-red-900 border-t mx-4 mt-4 sm:mx-6 lg:mx-8 rounded-lg shadow-inner">
            <pre className="text-xs sm:text-sm text-red-500 font-mono overflow-auto whitespace-pre-wrap">
              <span className="text-red-400 font-bold">exit status 1</span>{'\n'}
              {connectionError}
            </pre>
          </div>
        )}
  
        {/* Main Layout containing side-by-side components: Dashboard Controls and Log Aktifitas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8 max-w-[1850px] mx-auto w-full animate-in fade-in duration-550 items-start">
          
          {/* Left Column: Dashboard Controls (Using remaining space) */}
          <div className="flex-1 flex flex-col gap-6 w-full min-w-0">
            {draftConfig.connectionMode === 'proxy' && !isSystemInfoDismissed && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs sm:text-sm text-blue-700 animate-in fade-in duration-300 flex justify-between items-start gap-4">
                <div className="flex-1">
                  <strong>Info Sistem:</strong> Web ini otomatis menggunakan <b>Backend Proxy Server</b> untuk menghubungkan browser dengan broker <b>{draftConfig.name}</b> melalui port <b>TCP ({draftConfig.port})</b>. Hal ini menjamin sambungan yang 100% stabil, andal, dan melewati kendala pembatasan origin / mixed content di browser.
                </div>
                <button 
                  onClick={() => setIsSystemInfoDismissed(true)}
                  className="text-blue-500 hover:text-blue-800 transition-colors p-1 rounded-full hover:bg-blue-100 flex-shrink-0 cursor-pointer"
                  title="Tutup info"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
  
            <Dashboard 
              suhu={suhu} 
              kelembaban={kelembaban} 
              relays={relays} 
              onToggleRelay={publishRelay}
              onStopAll={handleStopAll}
              addLog={addLog}
              voiceText={voiceText}
              isListening={isListening}
              speechRecEnabled={speechRecEnabled}
              onToggleVoiceCommand={() => (window as any).handleVoiceCommand && (window as any).handleVoiceCommand()}
              isBrokerVisible={isSettingsVisible}
              brokerSettingsNode={settingsPanel}
              variationSpeed={variationSpeed}
              onChangeVariationSpeed={handleVariationSpeedChange}
              
              // Removed sync telemetry props
            />
          </div>
  
          {/* Right Side: Log Aktifitas (exactly matching the height) */}
          <div className="w-full lg:w-[350px] xl:w-[380px] flex-shrink-0 bg-slate-900 rounded-2xl shadow-sm border border-slate-800 flex flex-col overflow-hidden text-slate-300 h-[520px] lg:h-[580px]">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center flex-shrink-0">
              <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Log Aktifitas
              </h3>
              {logs.length > 0 && (
                <button onClick={() => setLogs([])} className="text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer">
                  Hapus
                </button>
              )}
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {logs.length === 0 ? (
                <p className="text-sm text-slate-500 text-center italic mt-10">Belum ada aktifitas</p>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="flex gap-3 text-sm border-b border-slate-800/40 pb-2 last:border-0 last:pb-0 animate-in fade-in duration-250">
                    <div className="text-xs text-slate-500 whitespace-nowrap pt-0.5 mt-0.5 font-mono">
                      {log.time.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                    </div>
                    <div className={`
                      flex-1 font-mono tracking-tight text-[11px] sm:text-[12px] leading-relaxed
                      ${log.type === 'error' ? 'text-[#F55E5E]' : ''}
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
  
        </main>
      </div>
    );
}
