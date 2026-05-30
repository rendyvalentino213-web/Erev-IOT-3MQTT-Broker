const mqtt = require('mqtt');
const wssUrls = [
  'wss://node02.myqtthub.com:8084/?clientId=webrendy1',
  'wss://node02.myqtthub.com:443/?clientId=webrendy1',
  'wss://node02.myqtthub.com:8084/',
  'wss://node02.myqtthub.com:443/'
];

wssUrls.forEach(url => {
  const client = mqtt.connect(url, {
    clientId: 'webrendy1',
    username: 'rendy13',
    password: '123',
    connectTimeout: 5000
  });
  client.on('connect', () => { console.log('Connected to:', url); client.end(); });
  client.on('error', (err) => { console.log('Error for', url, err.message); });
});
