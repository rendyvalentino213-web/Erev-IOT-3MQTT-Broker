import React from 'react';
import { Thermometer, Droplets, Power, Mic, MicOff, XOctagon } from 'lucide-react';

interface DashboardProps {
  suhu: string;
  kelembaban: string;
  relays: {
    relay1: boolean;
    relay2: boolean;
    relay3: boolean;
    relay4: boolean;
    variasi1: boolean;
    variasi2: boolean;
  };
  onToggleRelay: (relayId: string, state: boolean) => void;
  addLog: (message: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
  voiceText?: string;
  isListening?: boolean;
  speechRecEnabled?: boolean;
  onToggleVoiceCommand?: () => void;
}

export default function Dashboard({ suhu, kelembaban, relays, onToggleRelay, addLog, voiceText, isListening, speechRecEnabled, onToggleVoiceCommand }: DashboardProps) {
  const SensorCard = ({ title, value, unit, icon: Icon, colorClass }: any) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-slate-800">
          {value} <span className="text-xl font-medium text-slate-400">{unit}</span>
        </p>
      </div>
      <div className={`p-4 rounded-xl ${colorClass}`}>
        <Icon className="w-8 h-8" />
      </div>
    </div>
  );

  const RelayCard = ({ id, name, active }: { id: string, name: string, active: boolean }) => (
    <button
      onClick={() => onToggleRelay(id, !active)}
      className={`relative w-full rounded-2xl border p-4 sm:p-5 transition-all duration-300 flex flex-col items-start text-left focus:outline-none focus:ring-2 focus:ring-offset-2 overflow-hidden ${
        active 
        ? 'bg-gradient-to-br from-[#F55E5E] to-[#E04949] border-[#E04949] shadow-lg shadow-[#F55E5E]/30 focus:ring-[#F55E5E]' 
        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus:ring-slate-500'
      }`}
    >
      <div className={`p-2 sm:p-2.5 rounded-full mb-3 sm:mb-4 transition-colors duration-300 ${active ? 'bg-white/20 text-white shadow-inner' : 'bg-slate-100 text-slate-400'}`}>
        <Power className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
      <h3 className={`font-bold text-[13px] sm:text-[15px] mb-1 transition-colors duration-300 ${active ? 'text-white' : 'text-slate-800'}`}>{name}</h3>
      <p className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 ${active ? 'text-white/80' : 'text-slate-400'}`}>
        {active ? 'Aktif' : 'Off'}
      </p>
      
      {/* Decorative Active Indicator */}
      <div className={`absolute top-4 right-4 sm:top-5 sm:right-5 w-2 h-2 rounded-full transition-all duration-300 ${active ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-slate-300'}`} />
      
      {/* Interactive Ripple Effect Overlay */}
      <div className={`absolute inset-0 bg-white opacity-0 transition-opacity duration-300 ${active ? 'hover:opacity-10' : 'hover:opacity-50'}`} />
    </button>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Sensor Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <SensorCard 
          title="Suhu" 
          value={suhu} 
          unit="°C" 
          icon={Thermometer} 
          colorClass="bg-red-50 text-red-500" 
        />
        <SensorCard 
          title="Kelembaban" 
          value={kelembaban} 
          unit="%" 
          icon={Droplets} 
          colorClass="bg-blue-50 text-blue-500" 
        />
      </div>

      {/* Relays & Variasi Layout List */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
          Kontrol Cepat
        </h2>
        
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Baris 1: Relay 1, Relay 2, Voice Command */}
          <RelayCard id="relay1" name="Relay 1" active={relays.relay1} />
          <RelayCard id="relay2" name="Relay 2" active={relays.relay2} />
          
          <div className="col-span-2 lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 transition-all relative overflow-hidden flex items-center justify-between group hover:shadow-md hover:border-slate-300">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 rounded-l-2xl"></div>
            <div className="pl-2 sm:pl-3 flex flex-col justify-center h-full">
              <h2 className="text-xs sm:text-sm font-bold tracking-wide text-slate-800 mb-1 flex items-center gap-2">
                🎤 VOICE COMMAND
              </h2>
              <p className="text-[11px] sm:text-[13px] text-slate-500 mb-2 sm:mb-3">
                Coba ucapkan: <span className="text-slate-700 italic font-medium">"Nyalakan relay 1"</span>
              </p>
              <div className="min-h-[28px] flex items-center">
                  {voiceText ? (
                    <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100 shadow-sm animate-in fade-in duration-200">
                      "{voiceText}"
                    </div>
                  ) : (
                    speechRecEnabled ? (
                      <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium px-2 py-1 bg-slate-50 rounded-md border border-slate-100">Menunggu perintah suara...</div>
                    ) : (
                      <div className="text-red-500 text-[10px] sm:text-[11px] bg-red-50 px-2 py-1 rounded-md border border-red-100 font-medium">Browser tidak mendukung (Gunakan Chrome)</div>
                    )
                  )}
              </div>
            </div>
            
            <button 
              disabled={!speechRecEnabled}
              onClick={onToggleVoiceCommand}
              className={`flex-shrink-0 h-14 w-14 sm:h-20 sm:w-20 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none z-10 ${
                isListening 
                ? 'bg-blue-500 text-white animate-pulse shadow-xl ring-8 ring-blue-500/20' 
                : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 border border-slate-100 group-hover:border-blue-200 shadow-sm'
              }`}
            >
              {isListening ? <Mic className="w-6 h-6 sm:w-8 sm:h-8 animate-bounce" /> : <MicOff className="w-6 h-6 sm:w-8 sm:h-8" />}
            </button>
            
            {/* Background decoration */}
            <div className="absolute -right-8 -bottom-8 opacity-[0.03] pointer-events-none">
              <Mic className="w-48 h-48" />
            </div>
          </div>

          {/* Baris 2: Relay 3, Relay 4, Variasi 1, Variasi 2, STOP */}
          <RelayCard id="relay3" name="Relay 3" active={relays.relay3} />
          <RelayCard id="relay4" name="Relay 4" active={relays.relay4} />
          <RelayCard id="variasi1" name="Variasi 1" active={relays.variasi1} />
          <RelayCard id="variasi2" name="Variasi 2" active={relays.variasi2} />
          
          <button
            onClick={() => {
              onToggleRelay('relay1', false);
              onToggleRelay('relay2', false);
              onToggleRelay('relay3', false);
              onToggleRelay('relay4', false);
              onToggleRelay('variasi1', false);
              onToggleRelay('variasi2', false);
              if (addLog) addLog('Semua relay & variasi dimatikan (STOP)', 'warn');
            }}
            className="group col-span-2 lg:col-span-1 relative rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5 transition-all duration-300 hover:bg-red-600 hover:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 hover:shadow-lg hover:shadow-red-500/30 flex flex-col items-center justify-center text-center overflow-hidden"
          >
            <div className="p-2 sm:p-3 rounded-full mb-2 sm:mb-3 bg-white text-red-500 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:text-red-600">
              <XOctagon className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <h3 className="font-bold tracking-widest text-red-700 text-[13px] sm:text-sm mb-1 group-hover:text-white transition-colors duration-300">STOP</h3>
            <p className="text-[9px] sm:text-[10px] uppercase font-bold text-red-400 group-hover:text-red-200 transition-colors duration-300">Semua Perangkat</p>
            
            <div className={`absolute inset-0 bg-white opacity-0 transition-opacity duration-300 hover:opacity-10`} />
          </button>

        </div>
      </div>

    </div>
  );
}