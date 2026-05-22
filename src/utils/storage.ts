// ./src/utils/storage.ts
export function setToStorage<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Ошибка записи в localStorage:', error);
    }
}

export function getFromStorage<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error('Ошибка чтения из localStorage:', error);
        return null;
    }
}

/**
 * Сохранение данных в sessionStorage (живет строго в рамках текущей вкладки)
 */
export function setToSession<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
        window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Ошибка записи в sessionStorage:', error);
    }
}

/**
 * Получение данных из sessionStorage с автоматическим парсингом JSON
 */
export function getFromSession<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
        const item = window.sessionStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error('Ошибка чтения из sessionStorage:', error);
        return null;
    }
}
