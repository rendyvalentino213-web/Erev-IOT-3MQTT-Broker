import React, { useState } from 'react';
import { MqttConfig } from './MqttApp';
import { Server, User, Key, KeyRound, Wifi, ChevronDown, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface ConnectionFormProps {
  initialConfig: MqttConfig;
  onConnect: (config: MqttConfig) => void;
  isConnecting: boolean;
  error: string | null;
}

const PRESETS = [
  {
    name: 'MyQttHub',
    config: {
      host: 'node02.myqtthub.com',
      port: 443, // WSS
      protocol: 'wss',
      path: '/',
      clientId: 'esp32 test',
      username: 'rendy',
      password: ''
    }
  },
  {
    name: 'HiveMQ (Public)',
    config: {
      host: 'broker.hivemq.com',
      port: 8884,
      protocol: 'wss',
      path: '/mqtt',
      clientId: 'webclient_' + Math.random().toString(16).substring(2, 8),
      username: '',
      password: ''
    }
  },
  {
    name: 'Eclipse Mosquitto (Public)',
    config: {
      host: 'test.mosquitto.org',
      port: 8081,
      protocol: 'wss',
      path: '',
      clientId: 'webclient_' + Math.random().toString(16).substring(2, 8),
      username: '',
      password: ''
    }
  }
];

export default function ConnectionForm({ initialConfig, onConnect, isConnecting, error }: ConnectionFormProps) {
  const [config, setConfig] = useState<MqttConfig>(initialConfig);
  const [selectedPreset, setSelectedPreset] = useState<string>('MyQttHub');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect(config);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetName = e.target.value;
    setSelectedPreset(presetName);
    const preset = PRESETS.find(p => p.name === presetName);
    if (preset) {
      setConfig(prev => ({ ...prev, ...preset.config }) as MqttConfig);
    }
  };

  return (
    <div className="max-w-5xl w-full mx-auto my-8 sm:my-12 bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-200 flex flex-col md:flex-row min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
      
      {/* Left Sidebar */}
      <div className="md:w-5/12 bg-black px-8 py-10 flex flex-col justify-between relative overflow-hidden shrink-0">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#F55E5E] rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
        
        <div className="relative z-10">
          <div className="inline-flex bg-[#F55E5E] p-4 rounded-xl shadow-lg shadow-[#F55E5E]/30 mb-6">
            <Wifi className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Login Broker</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Hubungkan ke broker MQTT Anda untuk memulai kontrol perangkat IoT Erev secara realtime.
          </p>
        </div>

        <div className="relative z-10 mt-12 bg-white/5 border-l-2 border-[#F55E5E] p-4 rounded-r-lg">
          <h3 className="font-semibold text-slate-200 text-xs mb-2">Panduan Wajib MyQttHub 👇</h3>
          <ul className="list-disc pl-4 text-[11px] text-slate-400 space-y-1.5 marker:text-[#F55E5E]">
            <li><b>Client ID</b> isi dengan: <code className="text-white bg-black/50 px-1 rounded">esp32 test</code></li>
            <li><b>Username</b> isi dengan username akun/domain Anda: <code className="text-white bg-black/50 px-1 rounded">rendy</code></li>
            <li><b>Password</b>: Masukkan password dari device panel.</li>
            <li>Port WebSockets broker MyQttHub wajib <b>443</b> dan Path <b>/</b></li>
          </ul>
        </div>
      </div>

      {/* Right Form Area */}
      <div className="md:w-7/12 p-8 sm:p-12 flex flex-col justify-center bg-white relative">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 text-sm text-[#F55E5E] bg-[#F55E5E]/10 border border-[#F55E5E]/20 rounded-xl flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Koneksi Gagal</p>
                <p className="opacity-90 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Pilih Preset Broker</label>
            <div className="relative">
              <select
                value={selectedPreset}
                onChange={handlePresetChange}
                className="w-full appearance-none rounded-xl border border-slate-300 py-3 pl-4 pr-10 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#F55E5E] focus:border-transparent font-medium bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {PRESETS.map((preset) => (
                  <option key={preset.name} value={preset.name}>
                    {preset.name}
                  </option>
                ))}
                <option value="custom">Custom (Atur Sendiri)</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="h-5 w-5 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Host/Broker address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Server className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="host"
                    required
                    value={config.host}
                    onChange={handleChange}
                    className="pl-10 w-full rounded-xl border border-slate-200 py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#F55E5E] focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Port <span className="text-[10px] text-slate-400 font-normal">(WSS/WS)</span></label>
                <div className="relative">
                  <select
                    name="port"
                    required
                    value={config.port}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-xl border border-slate-200 py-3 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#F55E5E] focus:border-transparent transition-all cursor-pointer bg-white"
                  >
                    <option value={443}>443 (WSS)</option>
                    <option value={8083}>8083 (WSS)</option>
                    <option value={8084}>8084 (WSS)</option>
                    <option value={8884}>8884 (WSS)</option>
                    <option value={8080}>8080 (WS)</option>
                    <option value={8081}>8081 (WS)</option>
                    <option value={1883}>1883 (TCP - Hindari)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Client ID</label>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-slate-400" />
                  </div>
                <input
                  type="text"
                  name="clientId"
                  value={config.clientId}
                  onChange={handleChange}
                  className="pl-10 w-full rounded-xl border border-slate-200 py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#F55E5E] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Protocol</label>
                <select
                  name="protocol"
                  value={config.protocol}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#F55E5E] focus:border-transparent bg-white transition-all cursor-pointer"
                >
                  <option value="wss">wss:// (Secure)</option>
                  <option value="ws">ws:// (Akan diblokir browser HTTPS)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Path</label>
                <input
                  type="text"
                  name="path"
                  value={config.path}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#F55E5E] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Username</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                  <input
                    type="text"
                    name="username"
                    value={config.username}
                    onChange={handleChange}
                    className="pl-10 w-full rounded-xl border border-slate-200 py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#F55E5E] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Key className="h-4 w-4 text-slate-400" />
                    </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={config.password}
                    onChange={handleChange}
                    className="pl-10 pr-10 w-full rounded-xl border border-slate-200 py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#F55E5E] focus:border-transparent transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-[#F55E5E]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={isConnecting}
              className="w-full flex justify-center py-4 px-4 rounded-xl shadow-[0_8px_20px_-6px_rgba(245,94,94,0.4)] text-base font-bold text-white bg-[#F55E5E] hover:bg-[#E04949] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F55E5E] disabled:opacity-70 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              {isConnecting ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Menghubungkan...
                </div>
              ) : 'Hubungkan Sekarang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
