// ./src/db/db.ts (или ваш путь к файлу БД)
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { ICacheData } from '@/src/types/interfaces';
import { safeUnlinkSync } from '@/src/lib/helpers';

const dbPath = path.join(process.cwd(), './src/db/esi_cache.db');

const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);

// Ссылки на скомпилированные запросы (кэш стейтментов для максимальной производительности)
let stmtGet: Database.Statement;
let stmtSet: Database.Statement;
let stmtDelete: Database.Statement;
let stmtPurge: Database.Statement;

export function initDb(): void {
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('page_size = 4096');

    db.exec(`
    CREATE TABLE IF NOT EXISTS esi_cache (
      key TEXT PRIMARY KEY,
      etag TEXT,
      expires INTEGER,
      data TEXT
    )
  `);

    // Компилируем запросы один раз при инициализации
    stmtGet = db.prepare('SELECT * FROM esi_cache WHERE key = ?');
    stmtSet = db.prepare(`
    INSERT INTO esi_cache (key, etag, expires, data)
    VALUES (@key, @etag, @expires, @data)
    ON CONFLICT(key) DO UPDATE SET
      etag = excluded.etag,
      expires = excluded.expires,
      data = excluded.data
  `);
    stmtDelete = db.prepare('DELETE FROM esi_cache WHERE key = ?');
    stmtPurge = db.prepare('DELETE FROM esi_cache WHERE expires < ?');
}

// Инициализируем БД и компилируем стейтменты
initDb();

/**
 * Чтение записи из кэша.
 * Оптимизировано: использует предварительно скомпилированный стейтмент.
 */
export function getByKey(key: string): ICacheData | null {
    const result = stmtGet.get(key) as ICacheData | undefined;
    return result || null;
}

/**
 * Запись данных в кэш.
 * Оптимизировано: мгновенное выполнение скомпилированного стейтмента.
 */
export function setKey(entry: ICacheData): void {
    stmtSet.run(entry);
}

/**
 * Удаление конкретной записи из кэша по ключу.
 */
export function deleteKey(key: string): void {
    stmtDelete.run(key);
}

/**
 * Очистка всех просроченных записей.
 */
export function purgeExpired(): void {
    stmtPurge.run(Date.now());
}

/**
 * Оптимизация размера файла базы данных.
 */
export function vacuumDb(): void {
    db.exec('VACUUM');
}

/**
 * Полное удаление файлов базы данных с диска.
 */
export function dropDb(): void {
    try {
        db.close();
    } catch (error) {
        // Соединение уже закрыто
    }

    const filesToRemove = [dbPath, `${dbPath}-wal`, `${dbPath}-shm`];

    // Используем микрохелпер для атомарной очистки
    const len = filesToRemove.length;
    for (let i = 0; i < len; i++) {
        safeUnlinkSync(filesToRemove[i]);
    }

    console.log('db dropped');
}
