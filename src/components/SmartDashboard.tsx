import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import { Mic, MicOff, Thermometer, Droplets, Power, Server, Activity, Volume2 } from 'lucide-react';

export default function SmartDashboard() {
  const [mqttClient, setMqttClient] = useState<mqtt.MqttClient | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [temperature, setTemperature] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null);
  
  const [relays, setRelays] = useState({
    relay1: false,
    relay2: false,
    relay3: false,
    relay4: false,
  });

  const [isListening, setIsListening] = useState(false);

  // --- MQTT KONEKSI ---
  useEffect(() => {
    // 1. PENANGANAN KONEKSI RECT & CLEANUP - Generate Client ID acak
    const randomSuffix = Math.random().toString(16).substring(2, 10);
    const clientId = `web_${randomSuffix}`;
    
    // 2. DETAIL KONEKSI
    const host = 'wss://node02.myqtthub.com:443';
    const username = import.meta.env.VITE_MQTT_USER || '';
    const password = import.meta.env.VITE_MQTT_PASS || '';

    const options: mqtt.IClientOptions = {
      clientId,
      clean: true,
      reconnectPeriod: 5000, // Reconnect otomatis tiap 5 dtk
      username,
      password,
      path: '/'
    };

    setStatus('connecting');
    console.log(`Connecting to MQTT as ${clientId}...`);

    const client = mqtt.connect(host, options);

    client.on('connect', () => {
      console.log('Terhubung ke MyQttHub WSS');
      setStatus('connected');
      
      // Subscribe ke topik sensor
      client.subscribe('sensor/suhu');
      client.subscribe('sensor/kelembaban');
    });

    client.on('message', (topic, message) => {
      const payload = message.toString();
      console.log(`Topik: ${topic}, Pesan: ${payload}`);

      if (topic === 'sensor/suhu') {
        const val = parseFloat(payload);
        if (!isNaN(val)) setTemperature(val);
      } else if (topic === 'sensor/kelembaban') {
        const val = parseFloat(payload);
        if (!isNaN(val)) setHumidity(val);
      }
      
      // Optional: Update state tombol jika ESP publish state feedback
      // if (topic === 'kontrol/relay1') setRelays(prev => ({...prev, relay1: payload === 'ON'}));
    });

    client.on('error', (err) => {
      console.error('MQTT Error:', err);
      setStatus('error');
      setErrorMessage(`Gagal terhubung: ${err.message}`);
    });

    client.on('close', () => {
      console.log('Koneksi MQTT tertutup');
      if (status !== 'error') setStatus('connecting'); // Akan auto reconnect
    });

    setMqttClient(client);

    // CLEANUP KRUSIAL: Putus koneksi saat unmount agar MyQttHub tidak deteksi multi-connection spam dev-mode
    return () => {
      console.log('Membersihkan koneksi MQTT lama...');
      if (client) {
        client.end(true); // force close
      }
    };
  }, []);

  // --- KONTROL ALAT ---
  const handleRelayClick = (relayNumber: 1 | 2 | 3 | 4) => {
    if (!mqttClient || status !== 'connected') return;

    const relayKey = `relay${relayNumber}` as keyof typeof relays;
    const isCurrentlyOn = relays[relayKey];
    const newState = !isCurrentlyOn;
    const command = newState ? 'ON' : 'OFF';
    const topic = `kontrol/relay${relayNumber}`;

    // Publish pesan
    mqttClient.publish(topic, command, { qos: 0 }, (err) => {
      if (!err) {
        // Optimistic UI update
        setRelays(prev => ({
          ...prev,
          [relayKey]: newState
        }));
      }
    });
  };

  // --- FITUR CERDAS (VOICE COMMAND) ---
  const toggleVoiceCommand = () => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('Maaf, browser Anda (atau iFrame ini) tidak mendukung fitur Voice Command. Gunakan Chrome Desktop dan buka di tab baru.');
      return;
    }

    if (isListening) {
      // Tombol diklik lagi untuk stop (Opsional, tapi recognition di setup non-continuous)
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      console.log('Mulai mendengarkan...');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log('Perintah masuk:', transcript);
      processVoiceCommand(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      
      // Stop sintesis sebelumnya kalau masih ada
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const processVoiceCommand = (command: string) => {
    // Logic Suhu
    if (command.includes('berapa suhu') || command.includes('cek suhu')) {
      if (temperature !== null) {
        speakText(`Suhu saat ini adalah ${temperature} derajat Celcius.`);
      } else {
        speakText("Maaf, data suhu belum tersedia. Menunggu koneksi sensor.");
      }
      return;
    }

    if (!mqttClient || status !== 'connected') {
      speakText('Gagal mengeksekusi. Dashboard belum terhubung ke broker.');
      return;
    }

    // Logic Relay
    const nyalakan = command.includes('nyalakan') || command.includes('hidupkan');
    const matikan = command.includes('matikan');

    if (nyalakan || matikan) {
      const stateCmd = nyalakan ? 'ON' : 'OFF';
      const isSetOn = nyalakan;
      
      if (command.includes('satu') || command.includes('1')) {
        mqttClient.publish('kontrol/relay1', stateCmd);
        setRelays(p => ({...p, relay1: isSetOn}));
        speakText(`Oke, ${nyalakan ? 'menyalakan' : 'mematikan'} relay satu.`);
      } 
      else if (command.includes('dua') || command.includes('2')) {
        mqttClient.publish('kontrol/relay2', stateCmd);
        setRelays(p => ({...p, relay2: isSetOn}));
        speakText(`Oke, ${nyalakan ? 'menyalakan' : 'mematikan'} relay dua.`);
      }
      else if (command.includes('tiga') || command.includes('3')) {
        mqttClient.publish('kontrol/relay3', stateCmd);
        setRelays(p => ({...p, relay3: isSetOn}));
        speakText(`Oke, ${nyalakan ? 'menyalakan' : 'mematikan'} relay tiga.`);
      }
      else if (command.includes('empat') || command.includes('4')) {
        mqttClient.publish('kontrol/relay4', stateCmd);
        setRelays(p => ({...p, relay4: isSetOn}));
        speakText(`Oke, ${nyalakan ? 'menyalakan' : 'mematikan'} relay empat.`);
      }
    }
  };

  // --- UI RENDER (Dark Mode Tailwind) ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans selection:bg-emerald-500/30">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <Server className="w-8 h-8 text-emerald-400" />
              Smart Home
            </h1>
            <p className="text-slate-400 text-sm mt-1">IoT Command Center via MyQttHub</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 border ${
              status === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
              status === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
              'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {status === 'connected' ? <Activity className="w-4 h-4 animate-pulse" /> : <div className="w-2 h-2 rounded-full bg-current animate-ping" />}
              {status === 'connected' ? 'Connected' : status === 'error' ? 'Disconnected' : 'Connecting...'}
            </div>

            <button 
              onClick={toggleVoiceCommand}
              className={`p-3 rounded-full shadow-lg transition-all active:scale-95 ${
                isListening 
                ? 'bg-red-500 text-white shadow-red-500/40 hover:bg-red-600 animate-pulse' 
                : 'bg-emerald-500 text-white shadow-emerald-500/30 hover:bg-emerald-400'
              }`}
              title="Perintah Suara"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {status === 'error' && (
           <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
             {errorMessage}
           </div>
        )}

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* SECTION SENSOR */}
          <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col gap-6">
             <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
               <Activity className="w-5 h-5 text-cyan-400" />
               Environment Sensors
             </h2>
             <div className="grid grid-cols-2 gap-4 flex-1">
               {/* Card Suhu */}
               <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                 <div className="absolute -right-4 -top-4 w-16 h-16 bg-red-500/10 rounded-full blur-xl group-hover:bg-red-500/20 transition-colors"></div>
                 <Thermometer className="w-8 h-8 text-red-400 mb-3" />
                 <p className="text-slate-400 text-sm mb-1">Topik: sensor/suhu</p>
                 <p className="text-4xl font-bold tracking-tight text-white">
                   {temperature !== null ? `${temperature}°C` : '--'}
                 </p>
               </div>

               {/* Card Kelembaban */}
               <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                 <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-colors"></div>
                 <Droplets className="w-8 h-8 text-cyan-400 mb-3" />
                 <p className="text-slate-400 text-sm mb-1">sensor/kelembaban</p>
                 <p className="text-4xl font-bold tracking-tight text-white">
                   {humidity !== null ? `${humidity}%` : '--'}
                 </p>
               </div>
             </div>
          </section>

          {/* SECTION KONTROL RELAY */}
          <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 mb-6">
               <Power className="w-5 h-5 text-emerald-400" />
               Device Controls
             </h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {[1, 2, 3, 4].map((num) => {
                 const id = num as 1 | 2 | 3 | 4;
                 const isOn = relays[`relay${id}`];
                 return (
                   <div key={id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                     <div>
                       <h3 className="font-medium text-slate-200">Relay {id}</h3>
                       <p className="text-[10px] sm:text-xs text-slate-500 font-mono mt-0.5">kontrol/relay{id}</p>
                     </div>
                     <button
                       onClick={() => handleRelayClick(id)}
                       disabled={status !== 'connected'}
                       className={`relative w-14 h-8 rounded-full border-2 transition-colors duration-300 focus:outline-none flex-shrink-0
                         ${isOn ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-800 border-slate-700'}`}
                     >
                       <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-md
                         ${isOn ? 'translate-x-6' : 'translate-x-0'}`} 
                       />
                     </button>
                   </div>
                 );
               })}
             </div>
          </section>
          
        </div>

        {/* INFO PENGGUNAAN SUARA */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 md:p-5 flex gap-4">
          <div className="hidden sm:flex bg-blue-500/20 p-2 rounded-lg items-start h-fit">
            <Volume2 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h4 className="font-medium text-blue-300 mb-1">Tips Voice Command / Perintah Suara</h4>
            <p className="text-sm text-blue-400/80 leading-relaxed mb-2">
              Klik icon Mikrofon di atas-kanan, lalu sebutkan perintah seperti: <br/>
            </p>
            <ul className="list-disc pl-5 text-sm text-blue-200/90 space-y-1">
              <li><b>"Nyalakan relay satu"</b> atau <b>"Matikan relay satu"</b></li>
              <li><b>"Nyalakan lampu dua"</b></li>
              <li><b>"Berapa suhu?"</b> (AI akan menjawab dengan suara)</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
