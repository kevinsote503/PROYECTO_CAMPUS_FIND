/**
 * @file server.ts
 * @description Servidor central Node.js con Express, Base de Datos SQLite (3FN) y Frontend Estático en HTML5 + CSS3 + JS Puro.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import apiRoutes from './backend/routes';
import { runSeed } from './backend/database/seed';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares globales para manejo de peticiones y CORS (permite abrir index.html también con Live Server)
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Inicializar base de datos SQLite y sembrar datos iniciales con coordenadas GPS de Usulután
  try {
    await runSeed(false);
  } catch (error) {
    console.error('Advertencia al inicializar SQLite:', error);
  }

  // Rutas de la API RESTful (/api/*)
  app.use('/api', apiRoutes);

  // Servir la aplicación web estática (HTML + CSS + JS puro) desde /version-estatica
  const staticPath = path.join(process.cwd(), 'version-estatica');
  app.use(express.static(staticPath));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Campus Find Usulután (HTML + CSS + JS + SQLite 3FN) activo en http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error fatal al arrancar el servidor:', err);
  process.exit(1);
});
