import express from 'express';
import path from 'path';
import cors from 'cors';
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';
import apiRouter from './backend/src/routes/index';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const appUrl = process.env.APP_URL?.trim();

  if (appUrl) {
    app.use(cors({ origin: appUrl }));
  }
  app.use(express.json());

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'AI Power Exam Preparation Platform',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // REST API Routes
  app.use('/api', apiRouter);

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Power Exam Preparation server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start fullstack server:', err);
});
