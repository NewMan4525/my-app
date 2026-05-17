import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { ICacheData } from '@/src/types/interfaces';

// Абсолютный путь к файлу базы данных относительно корня проекта
const dbPath = path.join(process.cwd(), './src/db/esi_cache.db');

// ГАРАНТИЯ СУЩЕСТВОВАНИЯ ДИРЕКТОРИИ
// Код выполняется один раз при первом импорте модуля сервером.
// Это полностью предотвращает ошибку "directory does not exist".
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

// Открываем ОДНО постоянное соединение на весь жизненный цикл серверного процесса Node.js.
// Оно закроется автоматически самой операционной системой при остановке сервера.
const db = new Database(dbPath);

/**
 * Инициализация базы данных, оптимизация производительности и создание структуры таблиц.
 */
export const initDb = (): void => {
    // Настройки прагм для максимального быстродействия I/O операций в многопоточной среде
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('page_size = 4096');

    // Создаем таблицу кэша ESI, если база пустая
    db.exec(`
    CREATE TABLE IF NOT EXISTS esi_cache (
      key TEXT PRIMARY KEY,
      etag TEXT,
      expires INTEGER,
      data TEXT
    )
  `);
};

// Запускаем инициализацию строго один раз при загрузке модуля в память сервера
initDb();

/**
 * Чтение записи из кэша по строковому ключу (URL запроса).
 * Больше не тратит время на открытие и закрытие файла базы данных.
 * @param key Строковый URL-адрес запроса к ESI API.
 * @returns Объект ICacheData или null, если запись не найдена.
 */
export const getByKey = (key: string): ICacheData | null => {
    const stmt = db.prepare('SELECT * FROM esi_cache WHERE key = ?');
    const result = stmt.get(key) as ICacheData | undefined;
    return result || null;
};

/**
 * Запись данных в кэш. Создает новую запись или атомарно обновляет существующую при конфликте ключей.
 * @param entry Объект кэша, соответствующий интерфейсу ICacheData.
 */
export const setKey = (entry: ICacheData): void => {
    const stmt = db.prepare(`
    INSERT INTO esi_cache (key, etag, expires, data)
    VALUES (@key, @etag, @expires, @data)
    ON CONFLICT(key) DO UPDATE SET
      etag = excluded.etag,
      expires = excluded.expires,
      data = excluded.data
  `);
    stmt.run(entry);
};

/**
 * Удаление конкретной записи из кэша по ключу.
 * @param key Строковый URL-адрес, который необходимо инвалидировать.
 */
export const deleteKey = (key: string): void => {
    const stmt = db.prepare('DELETE FROM esi_cache WHERE key = ?');
    stmt.run(key);
};

/**
 * Очистка всех просроченных записей из базы данных.
 */
export const purgeExpired = (): void => {
    const stmt = db.prepare('DELETE FROM esi_cache WHERE expires < ?');
    stmt.run(Date.now());
};

/**
 * Оптимизация размера файла базы данных (сжатие свободного места на диске).
 */
export const vacuumDb = (): void => {
    db.exec('VACUUM');
};

/**
 * Полное удаление файлов базы данных с диска.
 * Перед удалением файлов принудительно закрывает удерживаемое соединение.
 */
export const dropDb = (): void => {
    try {
        // Освобождаем дескриптор файла в операционной системе, чтобы файлы можно было удалить
        db.close();
    } catch (error) {
        // Игнорируем ошибку, если соединение уже было закрыто ранее
    }

    // Список всех сопутствующих технических файлов SQLite в режиме WAL
    const filesToRemove = [dbPath, `${dbPath}-wal`, `${dbPath}-shm`];

    filesToRemove.forEach((file) => {
        try {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        } catch (error) {
            const err = error as Error;
            console.error(
                `Не удалось удалить файл базы данных ${file}:`,
                err.message,
            );
        }
    });
    console.log('db dropped');
};
