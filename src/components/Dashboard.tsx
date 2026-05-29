import React from 'react';
import { Thermometer, Droplets, Power } from 'lucide-react';

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
}

export default function Dashboard({ suhu, kelembaban, relays, onToggleRelay, addLog }: DashboardProps) {
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
    <div className={`rounded-xl border p-5 transition-all duration-200 ${active ? 'bg-[#F55E5E]/10 border-[#F55E5E]/20 hover:border-[#F55E5E]/30' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-slate-800">{name}</h3>
        <div className={`p-2 rounded-full transition-colors ${active ? 'bg-[#F55E5E]/20 text-[#F55E5E]' : 'bg-slate-100 text-slate-400'}`}>
          <Power className="w-5 h-5" />
        </div>
      </div>
      
      <button
        onClick={() => onToggleRelay(id, !active)}
        className={`w-full py-2.5 rounded-lg border font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all shadow-sm ${
          active 
          ? 'bg-[#F55E5E] text-white border-[#F55E5E] hover:bg-[#E04949] focus:ring-[#F55E5E] shadow-[#F55E5E]/20' 
          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 focus:ring-slate-500 hover:shadow-md'
        }`}
      >
        {active ? 'ON' : 'OFF'}
      </button>
    </div>
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

      {/* Relays & Variasi Grid */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Kontrol Device</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <RelayCard id="relay1" name="Relay 1" active={relays.relay1} />
          <RelayCard id="relay2" name="Relay 2" active={relays.relay2} />
          <RelayCard id="relay3" name="Relay 3" active={relays.relay3} />
          <RelayCard id="relay4" name="Relay 4" active={relays.relay4} />
        </div>
        
        <h2 className="text-lg font-semibold text-slate-800 mb-4 mt-6">Kontrol Variasi</h2>
        <div className="grid grid-cols-2 gap-4 max-w-xl">
          <RelayCard id="variasi1" name="Variasi 1" active={relays.variasi1} />
          <RelayCard id="variasi2" name="Variasi 2" active={relays.variasi2} />
        </div>
      </div>

    </div>
  );
}