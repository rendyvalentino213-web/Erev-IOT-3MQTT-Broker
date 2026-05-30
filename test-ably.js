const mqtt = require('mqtt');
const client = mqtt.connect('wss://mqtt.ably.io:443/', {
  clientId: 'test-ably-12345',
  username: 'saCuRw.TlY75w',
  password: 'EZffxoslAB9Xy81X0--ZKJ05Nk326crWVGKAaRGLfe8',
  protocolVersion: 4
});
client.on('error', (err) => { console.error('Error:', err.message); process.exit(1); });
client.on('connect', () => { console.log('Connected!'); process.exit(0); });
