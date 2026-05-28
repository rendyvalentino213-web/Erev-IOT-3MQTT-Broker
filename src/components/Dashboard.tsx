import React, { useState, useEffect } from 'react';
import { Thermometer, Droplets, Power, Mic, MicOff } from 'lucide-react';

interface DashboardProps {
  suhu: string;
  kelembaban: string;
  relays: {
    relay1: boolean;
    relay2: boolean;
    relay3: boolean;
    relay4: boolean;
  };
  onToggleRelay: (relayId: string, state: boolean) => void;
}

// Ensure SpeechRecognition types exist
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function Dashboard({ suhu, kelembaban, relays, onToggleRelay }: DashboardProps) {
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [speechRecEnabled, setSpeechRecEnabled] = useState(true);

  // Set up Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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

      // Process voice commands: "nyalakan relay 1", "matikan relay 2" dst
      if (text.includes("nyalakan relay satu") || text.includes("nyalakan relay 1") || text.includes("hidupkan relay 1")) {
        onToggleRelay('relay1', true);
      } else if (text.includes("matikan relay satu") || text.includes("matikan relay 1")) {
        onToggleRelay('relay1', false);
      } 
      else if (text.includes("nyalakan relay dua") || text.includes("nyalakan relay 2") || text.includes("hidupkan relay 2")) {
        onToggleRelay('relay2', true);
      } else if (text.includes("matikan relay dua") || text.includes("matikan relay 2")) {
        onToggleRelay('relay2', false);
      }
      else if (text.includes("nyalakan relay tiga") || text.includes("nyalakan relay 3") || text.includes("hidupkan relay 3")) {
        onToggleRelay('relay3', true);
      } else if (text.includes("matikan relay tiga") || text.includes("matikan relay 3")) {
        onToggleRelay('relay3', false);
      }
      else if (text.includes("nyalakan relay empat") || text.includes("nyalakan relay 4") || text.includes("hidupkan relay 4")) {
        onToggleRelay('relay4', true);
      } else if (text.includes("matikan relay empat") || text.includes("matikan relay 4")) {
        onToggleRelay('relay4', false);
      }

      timeoutId = setTimeout(() => {
        setVoiceText('');
      }, 3000);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      setVoiceText(`Error: ${event.error}`);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    // Attach to global window object so we can use it on button click
    window.handleVoiceCommand = () => {
      if (isListening) {
        recognition.stop();
        setIsListening(false);
      } else {
        clearTimeout(timeoutId);
        setVoiceText('Mendengarkan...');
        try {
          recognition.start();
          setIsListening(true);
        } catch (e) {
          console.error(e);
        }
      }
    };

    return () => {
      recognition.abort();
      delete window.handleVoiceCommand;
    };
  }, [onToggleRelay, isListening]);


  const SensorCard = ({ title, value, unit, icon: Icon, colorClass }: any) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
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
    <div className={`rounded-xl border p-5 transition-all duration-200 ${active ? 'bg-[#F55E5E]/10 border-[#F55E5E]/20' : 'bg-white border-slate-200'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-slate-800">{name}</h3>
        <div className={`p-2 rounded-full ${active ? 'bg-[#F55E5E]/20 text-[#F55E5E]' : 'bg-slate-100 text-slate-400'}`}>
          <Power className="w-5 h-5" />
        </div>
      </div>
      
      <button
        onClick={() => onToggleRelay(id, !active)}
        className={`w-full py-2.5 rounded-lg border font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
          active 
          ? 'bg-[#F55E5E] text-white border-[#F55E5E] hover:bg-[#E04949] focus:ring-[#F55E5E]' 
          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 focus:ring-slate-500'
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

      {/* Relays Grid */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Kontrol Relay</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <RelayCard id="relay1" name="Relay 1" active={relays.relay1} />
          <RelayCard id="relay2" name="Relay 2" active={relays.relay2} />
          <RelayCard id="relay3" name="Relay 3" active={relays.relay3} />
          <RelayCard id="relay4" name="Relay 4" active={relays.relay4} />
        </div>
      </div>

      {/* Voice Command Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-800 mb-1">Voice Command</h2>
            <p className="text-sm text-slate-500 mb-3">
              Gunakan suara Anda untuk mengendalikan relay. Contoh: <span className="italic text-slate-700 font-medium">"Nyalakan relay 1"</span> atau <span className="italic text-slate-700 font-medium">"Matikan relay 2"</span>.
            </p>
            {voiceText && (
              <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 text-sm font-medium">
                🗣️ "{voiceText}"
              </div>
            )}
            {!speechRecEnabled && (
                <div className="text-red-500 text-sm mt-2">Browser Anda tidak mendukung Voice Command. (Gunakan Chrome)</div>
            )}
          </div>
          
          <button
            disabled={!speechRecEnabled}
            onClick={() => window.handleVoiceCommand && window.handleVoiceCommand()}
            className={`flex-shrink-0 h-16 w-16 rounded-full flex items-center justify-center transition-all ${
              isListening 
              ? 'bg-red-500 text-white animate-pulse shadow-lg ring-4 ring-red-500/20' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200 shadow-sm'
            }`}
          >
            {isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>
        </div>
      </div>

    </div>
  );
}

declare global {
  interface Window {
    handleVoiceCommand?: () => void;
  }
}
