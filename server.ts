/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import express from 'express';
import { createServer as createViteServer } from 'vite';
import { exec } from 'child_process';
import AdmZip from 'adm-zip';

const app = express();
const PORT = 3000;

async function startServer() {
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Endpoint to build and download Yandex Games bundle
  app.get('/api/export-yandex', (req, res) => {
    console.log('Building bundle for Yandex Games...');
    exec('npm run build', (error, stdout, stderr) => {
      if (error) {
        console.error(`Build error: ${error.message}`);
        return res.status(500).send(`Build failed: ${error.message}`);
      }
      try {
        const zip = new AdmZip();
        zip.addLocalFolder('./dist');
        const zipBuffer = zip.toBuffer();
        res.setHeader('Content-Disposition', 'attachment; filename="yandex-neon-snake.zip"');
        res.setHeader('Content-Type', 'application/zip');
        res.send(zipBuffer);
      } catch (e: any) {
        console.error(`Zip error: ${e.message}`);
        res.status(500).send('Error creating zip archive');
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
