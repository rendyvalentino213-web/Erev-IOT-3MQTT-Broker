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
  await testWS('wss://node02.myqtthub.com/ws');
  await testWS('wss://node02.myqtthub.com/mqtt');
  await testWS('wss://node02.myqtthub.com/mqtt?clientId=test');
  await testWS('wss://node02.myqtthub.com:8883/');
})();
