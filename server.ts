import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, createWebSocketStream } from 'ws';
import net from 'net';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // We need an HTTP server to attach the WebSocket server
  const httpServer = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Setup WebSocket Server for MQTT Bridge
  const wss = new WebSocketServer({ server: httpServer, path: '/mqtt-proxy' });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection for MQTT proxy');
    
    // Connect to MyQttHub via TCP
    const myqtthubTcpStream = net.connect({
      port: 1883,
      host: 'node02.myqtthub.com',
    }, () => {
      console.log('Connected to MyQttHub TCP');
    });

    const wsStream = createWebSocketStream(ws);

    // Pipe the streams together
    wsStream.pipe(myqtthubTcpStream).pipe(wsStream);

    myqtthubTcpStream.on('error', (err) => {
      console.error('MyQttHub TCP Error:', err.message);
      ws.close();
    });

    ws.on('error', (err) => {
      console.error('WebSocket Error:', err.message);
      myqtthubTcpStream.destroy();
    });

    ws.on('close', () => {
      console.log('WebSocket closed');
      myqtthubTcpStream.destroy();
    });

    myqtthubTcpStream.on('close', () => {
      console.log('MyQttHub TCP closed');
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
