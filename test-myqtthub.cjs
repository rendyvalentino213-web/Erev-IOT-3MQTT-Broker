const mqtt = require('mqtt');
const client = mqtt.connect('wss://node02.myqtthub.com:8084/?clientId=webrendy1', {
  clientId: 'webrendy1',
  username: 'rendy13',
  password: '123',
  protocolVersion: 4
});
client.on('error', (err) => { console.error('Error:', err.message); process.exit(1); });
client.on('connect', () => { console.log('Connected to MyQttHub via WSS!'); process.exit(0); });
