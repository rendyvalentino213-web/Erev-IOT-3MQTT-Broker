import net from 'net';

const checkPort = (port) => {
  return new Promise(resolve => {
    const s = new net.Socket();
    s.setTimeout(2000, () => { s.destroy(); resolve(false); });
    s.connect(port, 'node02.myqtthub.com', () => { s.destroy(); resolve(true); });
    s.on('error', () => resolve(false));
  });
};

const ports = [443, 80, 8080, 8083, 8084, 8883, 8884];
(async () => {
  for (let p of ports) {
    const res = await checkPort(p);
    console.log(`Port ${p}: ${res ? 'OPEN' : 'CLOSED'}`);
  }
})();
