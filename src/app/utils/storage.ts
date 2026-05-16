// Сохранение данных
export function setToStorage<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Ошибка записи в localStorage:', error);
    }
}

// Получение данных с авто-парсингом
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
