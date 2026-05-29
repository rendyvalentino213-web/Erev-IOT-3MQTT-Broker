import net from 'net';

const checkPort = (port) => {
  return new Promise(resolve => {
    const s = new net.Socket();
    s.setTimeout(3000, () => { s.destroy(); resolve(false); });
    s.connect(port, 'node02.myqtthub.com', () => { s.destroy(); resolve(true); });
    s.on('error', () => resolve(false));
  });
};

const ports = [1883, 7443, 8000, 8081, 11883];
(async () => {
  for (let p of ports) {
    const res = await checkPort(p);
    console.log(`Port ${p}: ${res ? 'OPEN' : 'CLOSED'}`);
  }
})();
