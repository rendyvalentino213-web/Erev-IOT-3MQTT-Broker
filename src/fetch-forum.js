import https from 'https';

https.get('https://support.asplhosting.com/t/mqtt-client-with-websockets/660.json', res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log(data.slice(0, 1000)));
});
