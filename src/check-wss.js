import https from 'https';

https.get('https://support.asplhosting.com/t/is-there-any-wss-port-in-myqtthub-service/652', {
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, (res) => {
  let data = '';
  res.on('data', c => data+=c);
  res.on('end', () => console.log(data.includes('443') || data.includes('8080') || data.includes('wss')));
});
