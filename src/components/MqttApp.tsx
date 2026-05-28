import React, { useState, useEffect, useRef } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import ConnectionForm from './ConnectionForm';
import Dashboard from './Dashboard';
import { Settings, Zap } from 'lucide-react';

export interface MqttConfig {
  host: string;
  port: number;
  clientId: string;
  username?: string;
  password?: string;
  path: string;
  protocol: 'ws' | 'wss';
}

export default function MqttApp() {
  const [config, setConfig] = useState<MqttConfig>({
    host: 'node02.myqtthub.com',
    port: 8883,
    clientId: 'rendyvalentino213@gmail.com',
    username: 'rendyvalentino123',
    password: 'GDm1UEZR-gTtu8Hl1',
    path: '/',
    protocol: 'wss',
  });

  const [client, setClient] = useState<MqttClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // States for Sensor Data
  const [suhu, setSuhu] = useState<string>('--');
  const [kelembaban, setKelembaban] = useState<string>('--');

  // States for Relays
  const [relays, setRelays] = useState({
    relay1: false,
    relay2: false,
    relay3: false,
    relay4: false,
  });

  const disconnect = () => {
    if (client) {
      client.end();
      setClient(null);
      setIsConnected(false);
    }
  };

  const connect = (newConfig: MqttConfig) => {
    setConfig(newConfig);
    setIsConnecting(true);
    setConnectionError(null);

    // Clean up existing client
    if (client) {
      client.end(true);
    }

    const { host, port, clientId, username, password, path, protocol } = newConfig;
    const url = `${protocol}://${host}:${port}${path}`;

    const options: mqtt.IClientOptions = {
      clientId,
      username,
      password,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 10 * 1000,
    };

    console.log('Connecting to', url, options);

    try {
      const mqttClient = mqtt.connect(url, options);

      mqttClient.on('connect', () => {
        console.log('Connected to MQTT Broker!');
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionError(null);
        setClient(mqttClient);

        // Subscribe to sensor topics
        mqttClient.subscribe('sensor/suhu');
        mqttClient.subscribe('sensor/kelembaban');
        
        // Optionally listen to relay states if the device publishes them 
        // (but according to the Arduino code provided, it only subscribes to them. 
        // We will assume "optimistic" UI updates or just store local state for now).
      });

      mqttClient.on('message', (topic, message) => {
        const payload = message.toString();
        // console.log(`Received message on ${topic}: ${payload}`);

        if (topic === 'sensor/suhu') {
          setSuhu(payload);
        } else if (topic === 'sensor/kelembaban') {
          setKelembaban(payload);
        }
      });

      mqttClient.on('error', (err) => {
        console.error('MQTT Connection Error:', err);
        setConnectionError(`Connection Error: ${err.message}`);
        setIsConnecting(false);
        mqttClient.end();
      });

      mqttClient.on('close', () => {
        console.log('MQTT Connection closed');
        setIsConnected(false);
        setIsConnecting(false);
      });

    } catch (err: any) {
      setConnectionError(`Failed to create client: ${err.message}`);
      setIsConnecting(false);
    }
  };

  const publishRelay = (relayId: string, state: boolean) => {
    if (client && isConnected) {
      const topic = `kontrol/${relayId}`;
      const payload = state ? 'ON' : 'OFF';
      client.publish(topic, payload);
      
      // Optimitistic update
      setRelays(prev => ({ ...prev, [relayId]: state }));
    } else {
      alert("Belum terhubung ke MQTT Broker");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="bg-black text-white py-4 px-6 sm:px-8 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-[#F55E5E] p-2 rounded-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Erev IoT MQTT Broker</h1>
          </div>
        </div>
        <div>
          {isConnected && (
            <button
              onClick={disconnect}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Diskoneksi
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {!isConnected ? (
          <ConnectionForm 
            initialConfig={config} 
            onConnect={connect} 
            isConnecting={isConnecting}
            error={connectionError}
          />
        ) : (
          <Dashboard 
            suhu={suhu} 
            kelembaban={kelembaban} 
            relays={relays} 
            onToggleRelay={publishRelay} 
          />
        )}
      </main>
    </div>
  );
}
