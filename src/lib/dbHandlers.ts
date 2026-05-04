import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { ICacheData } from "@/src/types/interfaces";

const dbPath = path.join(process.cwd(), "./src/db/esi_cache.db");

/**
 * Инициализация базы данных и создание таблицы
 */
export const initDb = (): void => {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("page_size = 4096");

  db.exec(`
    CREATE TABLE IF NOT EXISTS esi_cache (
      key TEXT PRIMARY KEY,
      etag TEXT,
      expires INTEGER,
      data TEXT
    )
  `);
  db.close();

  console.log("db init");
};

/**
 * Чтение записи по ключу
 */
export const getByKey = (key: string): ICacheData | null => {
  const db = new Database(dbPath);
  const stmt = db.prepare("SELECT * FROM esi_cache WHERE key = ?");
  const result = stmt.get(key) as ICacheData | undefined;
  db.close();
  return result || null;
};

/**
 * Запись данных (создает новую или перезаписывает существующую)
 */
export const setKey = (entry: ICacheData): void => {
  const db = new Database(dbPath);
  const stmt = db.prepare(`
    INSERT INTO esi_cache (key, etag, expires, data)
    VALUES (@key, @etag, @expires, @data)
    ON CONFLICT(key) DO UPDATE SET
      etag = excluded.etag,
      expires = excluded.expires,
      data = excluded.data
  `);
  stmt.run(entry);
  db.close();
};

/**
 * Удаление конкретного ключа
 */
export const deleteKey = (key: string): void => {
  const db = new Database(dbPath);
  const stmt = db.prepare("DELETE FROM esi_cache WHERE key = ?");
  stmt.run(key);
  db.close();
};

/** Очистка просроченных записей из БД */
// export const purge=>(): void =>{
//   const stmt = db.prepare("DELETE FROM esi_cache WHERE expires < ?");
//   const result = stmt.run(Date.now());
//   return
// }
// /** Оптимизация размера файла БД */
// vacuum(): void {
//   db.exec("VACUUM");
// },

/**
 * Полное удаление файла базы данных
 */
export const dropDb = (): void => {
  // Список всех возможных файлов SQLite
  const filesToRemove = [dbPath, `${dbPath}-wal`, `${dbPath}-shm`];

  filesToRemove.forEach((file) => {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    } catch (error) {
      const err = error as Error;
      console.error(`Не удалось удалить файл ${file}:`, err.message);
    }
  });
  console.log("db droped");
};
