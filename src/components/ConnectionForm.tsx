import React, { useState } from 'react';
import { MqttConfig } from './MqttApp';
import { Server, User, Key, KeyRound, Wifi, ChevronDown, Settings2 } from 'lucide-react';

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
      port: 8083,
      protocol: 'wss',
      path: '/',
      clientId: 'esp32test_web',
      username: 'rendy',
      password: 'password123'
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
  const [showAdvanced, setShowAdvanced] = useState(false);

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
    <div className="max-w-md mx-auto mt-10 sm:mt-16 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-black px-6 py-8 text-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#F55E5E] rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
        
        <div className="relative flex justify-center mb-4">
          <div className="bg-[#F55E5E] p-3 rounded-2xl shadow-lg shadow-[#F55E5E]/30">
            <Wifi className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-white relative">Login / Hubungkan Broker</h2>
        <p className="text-slate-400 text-sm mt-2 relative">Pilih broker MQTT untuk memulai kontrol IoT Anda.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5 relative">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
            {error}
          </div>
        )}

        <div>
           <label className="block text-sm font-medium text-slate-700 mb-1.5">Pilih Preset Broker</label>
           <div className="relative">
             <select
               value={selectedPreset}
               onChange={handlePresetChange}
               className="w-full appearance-none rounded-xl border border-slate-300 py-3 pl-4 pr-10 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#F55E5E] focus:border-transparent font-medium bg-slate-50 hover:bg-slate-100/50 transition-colors cursor-pointer"
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

        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              {showAdvanced ? 'Sembunyikan Detail' : 'Lihat Detail'}
            </button>
          </div>
        </div>

        <div className={`space-y-4 overflow-hidden transition-all duration-300 ${showAdvanced ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Host/Broker address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Server className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="host"
                  required
                  value={config.host}
                  onChange={handleChange}
                  className="pl-8 w-full rounded-lg border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F55E5E] focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Port (WSS)</label>
              <input
                type="number"
                name="port"
                required
                value={config.port}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F55E5E] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Client ID</label>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                <input
                  type="text"
                  name="clientId"
                  value={config.clientId}
                  onChange={handleChange}
                  className="pl-8 w-full rounded-lg border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F55E5E] focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Path</label>
              <input
                type="text"
                name="path"
                value={config.path}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F55E5E] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Username (Opsional)</label>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                <input
                  type="text"
                  name="username"
                  value={config.username}
                  onChange={handleChange}
                  className="pl-8 w-full rounded-lg border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F55E5E] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Password (Opsional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                <input
                  type="password"
                  name="password"
                  value={config.password}
                  onChange={handleChange}
                  className="pl-8 w-full rounded-lg border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F55E5E] focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isConnecting}
            className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg shadow-[#F55E5E]/20 text-sm font-semibold text-white bg-[#F55E5E] hover:bg-[#E04949] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F55E5E] disabled:opacity-70 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            {isConnecting ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
  );
}
