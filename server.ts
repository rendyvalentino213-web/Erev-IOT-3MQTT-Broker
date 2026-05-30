import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, createWebSocketStream } from 'ws';
import net from 'net';
import tls from 'tls';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // We need an HTTP server to attach the WebSocket server
  const httpServer = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Setup WebSocket Server for MQTT Bridge
  const wss = new WebSocketServer({ server: httpServer, path: '/mqtt-proxy' });

  wss.on('connection', (ws, req) => {
    const urlParams = new URL(req.url || '', 'ws://localhost').searchParams;
    const targetHost = urlParams.get('host') || 'node02.myqtthub.com';
    const targetPort = Number(urlParams.get('port')) || 1883;

    console.log(`New WebSocket proxy connection to ${targetHost}:${targetPort}`);
    
    // Dynamic protocol selector: Use TLS if destination port is a known secure/SSL port
    const isTls = targetPort === 4883 || targetPort === 8883 || targetPort === 10443 || targetPort === 443 || targetPort === 8884;
    console.log(`Initiating stream connection to ${targetHost}:${targetPort} [Protocol: ${isTls ? 'TLS/SSL Secure' : 'Insecure TCP'}]`);

    let targetTcpStream: any;
    try {
      if (isTls) {
        targetTcpStream = tls.connect({
          port: targetPort,
          host: targetHost,
          rejectUnauthorized: false, // Bypass self-signed socket certificate constraints
        }, () => {
          console.log(`Connected to target secure TLS broker: ${targetHost}:${targetPort}`);
        });
      } else {
        targetTcpStream = net.connect({
          port: targetPort,
          host: targetHost,
        }, () => {
          console.log(`Connected to target TCP broker: ${targetHost}:${targetPort}`);
        });
      }
    } catch (e: any) {
      console.error(`Failed to initiate bridge socket: ${e.message}`);
      ws.close();
      return;
    }

    const wsStream = createWebSocketStream(ws);

    // Pipe the streams together
    wsStream.pipe(targetTcpStream).pipe(wsStream);

    targetTcpStream.on('error', (err) => {
      console.error(`TCP Proxy Error (${targetHost}:${targetPort}):`, err.message);
      ws.close();
    });

    ws.on('error', (err) => {
      console.error('WebSocket Error:', err.message);
      targetTcpStream.destroy();
    });

    ws.on('close', () => {
      console.log('WebSocket closed');
      targetTcpStream.destroy();
    });

    targetTcpStream.on('close', () => {
      console.log(`TCP closed for ${targetHost}:${targetPort}`);
      ws.close();
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

startServer();
