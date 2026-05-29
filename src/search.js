const https = require('https');
https.get('https://html.duckduckgo.com/html/?q=myqtthub.com+websocket+port', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data.slice(0, 10000)));
});
