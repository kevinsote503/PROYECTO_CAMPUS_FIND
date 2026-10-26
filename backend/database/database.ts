/**
 * @file database.ts
 * @description Configuración de conexión con la base de datos SQLite mediante el ORM Sequelize.
 * 
 * =============================================================================
 * JUSTIFICACIÓN DE ELECCIÓN DEL ORM (Sequelize con dialecto sqlite3):
 * 1. Portabilidad y Cero Configuración: A diferencia de Prisma, que compila
 *    binarios nativos de motor (query-engine) dependientes de la arquitectura del OS
 *    y requiere pasos de generación (`prisma generate`), Sequelize es 100% JavaScript/TypeScript
 *    y opera de forma inmediata en cualquier contenedor o entorno Node.js sin fricción.
 * 2. Soporte nativo para SQLite embebido: Permite incluir el archivo .db directamente
 *    en el proyecto y sincronizar modelos relacionales con claves foráneas estrictas.
 * 3. Mantenibilidad y Modelos Declarativos: Los esquemas se definen con tipos fuertemente
 *    tipados, hooks de ciclo de vida (ej. hasheo de contraseñas), asociaciones relacionales
 *    3FN directas y consultas fluidas mediante JavaScript estándar.
 * =============================================================================
 */

import { Sequelize } from 'sequelize';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { DatabaseSync } from 'node:sqlite';

dotenv.config();

// Determinar la ruta del archivo de base de datos SQLite
const dbPath = process.env.SQLITE_DB_PATH
  ? path.resolve(process.cwd(), process.env.SQLITE_DB_PATH)
  : path.resolve(process.cwd(), 'backend/database/campus_find.db');

// Asegurar que el directorio de la base de datos exista
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

/**
 * Adaptador de compatibilidad sqlite3 basado en el motor nativo de Node.js v22 (node:sqlite).
 * Garantiza cero problemas de compilación nativa o incompatibilidades de GLIBC.
 */
class SQLite3NativeDatabase {
  db!: DatabaseSync;
  filename: string;

  constructor(filename: string, mode?: any, callback?: any) {
    if (typeof mode === 'function') {
      callback = mode;
    }
    this.filename = filename;
    try {
      this.db = new DatabaseSync(filename);
      // Activar soporte estricto de claves foráneas (3FN) en SQLite
      this.db.exec('PRAGMA foreign_keys = ON;');
      if (callback) {
        process.nextTick(() => callback(null));
      }
    } catch (err) {
      if (callback) {
        process.nextTick(() => callback(err));
      }
    }
  }

  private execWithParams(mode: 'run' | 'all' | 'get', sql: string, params: any): any {
    const stmt = this.db.prepare(sql);
    const sanitize = (v: any) => {
      if (v === undefined) return null;
      if (typeof v === 'boolean') return v ? 1 : 0;
      if (v instanceof Date) return v.toISOString();
      return v;
    };

    if (Array.isArray(params)) {
      const cleanArr = params.map(sanitize);
      return cleanArr.length > 0 ? (stmt[mode] as any)(...cleanArr) : (stmt[mode] as any)();
    }

    if (params && typeof params === 'object' && Object.keys(params).length > 0) {
      const cleanObj: Record<string, any> = {};
      for (const [k, v] of Object.entries(params)) {
        cleanObj[k] = sanitize(v);
      }
      return (stmt[mode] as any)(cleanObj);
    }

    return (stmt[mode] as any)();
  }

  run(sql: string, params: any, callback?: any) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    try {
      const res = this.execWithParams('run', sql, params);
      const ctx = {
        lastID: Number(res.lastInsertRowid),
        changes: Number(res.changes),
      };
      if (callback) {
        process.nextTick(() => callback.call(ctx, null));
      }
    } catch (err) {
      if (callback) {
        process.nextTick(() => callback(err));
      }
    }
    return this;
  }

  all(sql: string, params: any, callback?: any) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    try {
      const rows = this.execWithParams('all', sql, params);
      if (callback) {
        process.nextTick(() => callback(null, rows));
      }
    } catch (err) {
      if (callback) {
        process.nextTick(() => callback(err));
      }
    }
    return this;
  }

  get(sql: string, params: any, callback?: any) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    try {
      const row = this.execWithParams('get', sql, params);
      if (callback) {
        process.nextTick(() => callback(null, row));
      }
    } catch (err) {
      if (callback) {
        process.nextTick(() => callback(err));
      }
    }
    return this;
  }

  serialize(cb: () => void) {
    if (cb) cb();
    return this;
  }

  configure() {
    return this;
  }

  close(cb?: any) {
    try {
      this.db.close();
      if (cb) {
        process.nextTick(() => cb(null));
      }
    } catch (err) {
      if (cb) {
        process.nextTick(() => cb(err));
      }
    }
  }
}

const sqlite3Driver = {
  Database: SQLite3NativeDatabase,
  OPEN_READWRITE: 1,
  OPEN_CREATE: 2,
};

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  dialectModule: sqlite3Driver as any,
  logging: false,
  define: {
    timestamps: false,
    underscored: true,
  },
});

export default sequelize;
