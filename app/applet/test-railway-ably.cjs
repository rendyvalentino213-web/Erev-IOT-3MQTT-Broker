const mqtt = require('mqtt');
const url = 'wss://erev-iot-3mqtt-broker-production.up.railway.app/mqtt-proxy?host=mqtt.ably.io&port=8883';
const client = mqtt.connect(url, {
  clientId: 'webrendy1-test',
  username: 'saCuRw.TlY75w',
  password: 'EZffxoslAB9Xy81X0--ZKJ05Nk326crWVGKAaRGLfe8',
  protocolVersion: 4,
  connectTimeout: 5000
});
client.on('connect', () => { console.log('Connected to proxy for Ably!'); client.end(); });
client.on('error', (err) => { console.log('Error:', err.message); process.exit(1); });
