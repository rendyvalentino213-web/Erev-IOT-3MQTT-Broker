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
  onStopAll?: () => void;
  addLog: (message: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
  voiceText?: string;
  isListening?: boolean;
  speechRecEnabled?: boolean;
  onToggleVoiceCommand?: () => void;
  isBrokerVisible?: boolean;
  brokerSettingsNode?: React.ReactNode;
  variationSpeed?: number;
  onChangeVariationSpeed?: (speed: number) => void;
}

export default function Dashboard({ suhu, kelembaban, relays, onToggleRelay, onStopAll, addLog, voiceText, isListening, speechRecEnabled, onToggleVoiceCommand, isBrokerVisible = true, brokerSettingsNode, variationSpeed = 200, onChangeVariationSpeed }: DashboardProps) {
  const SensorCard = ({ title, value, unit, icon: Icon, colorClass }: any) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 flex items-center justify-between hover:shadow-md transition-shadow h-full">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{title}</p>
        <p className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight truncate">
          {value}<span className="text-sm sm:text-base font-bold text-slate-400 ml-0.5">{unit}</span>
        </p>
      </div>
      <div className={`p-2.5 rounded-xl flex-shrink-0 ml-3 ${colorClass}`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
    </div>
  );

  const VoiceCard = () => (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 transition-all relative overflow-hidden flex items-center justify-between group hover:shadow-md hover:border-slate-300 h-full min-h-[120px]">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 rounded-l-2xl"></div>
      <div className="pl-2 sm:pl-3 flex flex-col justify-center h-full min-w-0 flex-1 mr-2">
        <h2 className="text-xs sm:text-sm font-bold tracking-wide text-slate-800 mb-1 flex items-center gap-2 uppercase">
          VOICE COMMAND
        </h2>
        <p className="text-[11px] sm:text-[12px] text-slate-500 mb-1.5 truncate">
          Ucapkan: <span className="text-slate-700 italic font-medium">"Nyalakan lampu 1"</span>
        </p>
        <div className="min-h-[24px] flex items-center">
            {voiceText ? (
              <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-100 shadow-sm animate-in fade-in duration-200">
                "{voiceText}"
              </div>
            ) : (
              speechRecEnabled ? (
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium px-2 py-0.5 bg-slate-50 rounded border border-slate-100">Menunggu suara...</div>
              ) : (
                <div className="text-red-500 text-[9px] sm:text-[10px] bg-red-50 px-2 py-0.5 rounded border border-red-100 font-medium whitespace-nowrap">Chrome saja</div>
              )
            )}
        </div>
      </div>
      
      <button 
        disabled={!speechRecEnabled}
        onClick={onToggleVoiceCommand}
        className={`flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none z-10 ${
          isListening 
          ? 'bg-blue-500 text-white animate-pulse shadow-xl ring-4 ring-blue-500/20' 
          : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 border border-slate-100 group-hover:border-blue-200 shadow-sm'
        }`}
      >
        {isListening ? <Mic className="w-5 h-5 animate-bounce" /> : <MicOff className="w-5 h-5" />}
      </button>
      
      {/* Background decoration */}
      <div className="absolute -right-8 -bottom-8 opacity-[0.02] pointer-events-none">
        <Mic className="w-32 h-32" />
      </div>
    </div>
  );

  const RelayCard = ({ id, name, active }: { id: string, name: string, active: boolean }) => (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between items-start transition-shadow hover:shadow-sm h-full min-h-[130px]">
      <div className="flex justify-between items-start w-full mb-4">
        <div className={`p-2.5 rounded-xl transition-colors duration-300 ${active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
          <Power className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <button 
          onClick={() => onToggleRelay(id, !active)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${active ? 'bg-emerald-500' : 'bg-slate-200'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${active ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
      <div>
        <h3 className="font-bold text-slate-800 text-[14px] sm:text-[15px]">{name}</h3>
        <p className={`text-[11px] sm:text-[12px] font-bold uppercase tracking-wider mt-1 ${active ? 'text-emerald-500' : 'text-slate-400'}`}>
          {active ? 'ON' : 'OFF'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Broker Settings on top (spanning full width) if visible */}
      {isBrokerVisible && brokerSettingsNode && (
        <div className="w-full">
          {brokerSettingsNode}
        </div>
      )}

      {/* Sensor Row & Voice Command are ALWAYS placed side-by-side on 1 row */}
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          <div className="xl:col-span-2 grid grid-cols-2 gap-3 sm:gap-4">
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
          <div className="xl:col-span-1 flex">
            <VoiceCard />
          </div>
        </div>
      </div>

      {/* Relays & Variasi Layout List */}
      <div>
        <div className="flex flex-col gap-4 sm:gap-6 mt-4 sm:mt-6">
          
          {/* Variasi & Stop Box */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:shadow-md hover:border-slate-300 transition-all">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-400 rounded-l-2xl"></div>
            
            <div className="pl-3 flex flex-col gap-1 md:flex-1">
              <h2 className="text-xs sm:text-sm font-bold tracking-wide text-slate-800 uppercase flex items-center gap-2">
                MODE VARIASI
              </h2>
              {onChangeVariationSpeed && (
                <div className="flex items-center gap-2.5 mt-1 sm:mt-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Kecepatan:</span>
                  <input 
                    type="range" 
                    min="50" 
                    max="1000" 
                    step="50"
                    value={variationSpeed} 
                    onChange={(e) => onChangeVariationSpeed(Number(e.target.value))}
                    className="w-24 sm:w-32 accent-indigo-500 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer hover:bg-slate-200 transition-colors"
                  />
                  <span className="text-[10px] font-mono font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 whitespace-nowrap">
                    {variationSpeed}ms
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <button 
                onClick={() => onToggleRelay('variasi1', !relays.variasi1)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 border ${relays.variasi1 ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/20' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'}`}
              >
                Variasi 1 {relays.variasi1 && '(ON)'}
              </button>
              <button 
                onClick={() => onToggleRelay('variasi2', !relays.variasi2)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 border ${relays.variasi2 ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/20' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'}`}
              >
                Variasi 2 {relays.variasi2 && '(ON)'}
              </button>
              
              {/* Divider on desktop */}
              <div className="hidden sm:block w-px h-8 bg-slate-200 mx-1"></div>

              <button
                onClick={() => {
                  if (onStopAll) {
                    onStopAll();
                  } else {
                    onToggleRelay('relay1', false);
                    onToggleRelay('relay2', false);
                    onToggleRelay('relay3', false);
                    onToggleRelay('relay4', false);
                    onToggleRelay('variasi1', false);
                    onToggleRelay('variasi2', false);
                    if (addLog) addLog('Semua relay & variasi dimatikan (STOP)', 'warn');
                  }
                }}
                className="group relative px-4 py-2.5 rounded-xl text-xs font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300 shadow-sm flex items-center gap-1.5"
              >
                <XOctagon className="w-4 h-4" /> STOP
              </button>
            </div>
          </div>

          {/* Lampu controls */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 relative overflow-hidden flex flex-col gap-4 transition-all hover:shadow-md hover:border-slate-300 group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 rounded-l-2xl"></div>
            <div className="pl-3">
              <h2 className="text-xs sm:text-sm font-bold tracking-wide text-slate-800 mb-2 flex items-center gap-2 uppercase">
                Kontrol Lampu
              </h2>
              <div className="grid grid-cols-1 min-[450px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                <RelayCard id="relay1" name="Lampu 1" active={relays.relay1} />
                <RelayCard id="relay2" name="Lampu 2" active={relays.relay2} />
                <RelayCard id="relay3" name="Lampu 3" active={relays.relay3} />
                <RelayCard id="relay4" name="Lampu 4" active={relays.relay4} />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}