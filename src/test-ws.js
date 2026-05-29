import WebSocket from 'ws';

function testWS(url) {
  return new Promise(resolve => {
    const ws = new WebSocket(url);
    ws.on('open', () => { console.log('OPENED', url); ws.close(); resolve(); });
    ws.on('error', (err) => { console.log('ERROR', url, err.message); resolve(); });
    ws.on('unexpected-response', (req, res) => {
      console.log('UNEXPECTED', url, res.statusCode, res.statusMessage);
      resolve();
    });
  });
}

(async () => {
  await testWS('wss://node02.myqtthub.com:443');
  await testWS('ws://node02.myqtthub.com:80');
})();
