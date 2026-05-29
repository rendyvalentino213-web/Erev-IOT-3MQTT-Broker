import mqtt from 'mqtt';

const client = mqtt.connect('wss://node02.myqtthub.com:443', {
  clientId: 'testclient' + Math.random(),
  connectTimeout: 5000
});

client.on('connect', () => {
  console.log('CONNECTED WSS 443');
  client.end();
});
client.on('error', (err) => {
  console.log('ERROR WSS 443', err.message);
});

const c2 = mqtt.connect('ws://node02.myqtthub.com:80', {
  clientId: 'testclient' + Math.random(),
  connectTimeout: 5000
});

c2.on('connect', () => {
  console.log('CONNECTED WS 80');
  c2.end();
});
c2.on('error', (err) => {
  console.log('ERROR WS 80', err.message);
});
