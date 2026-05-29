import net from 'net';

const checkPort = (port) => {
  return new Promise(resolve => {
    const s = new net.Socket();
    s.setTimeout(500, () => { s.destroy(); resolve(false); });
    s.connect(port, 'node02.myqtthub.com', () => { s.destroy(); resolve(true); });
    s.on('error', () => resolve(false));
  });
};

(async () => {
  for (let i = 8000; i <= 8900; i++) {
    const res = await checkPort(i);
    if (res && i !== 8883) {
      console.log(`Port ${i}: OPEN`);
    }
  }
  console.log('DONE');
})();
