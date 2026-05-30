// ./src/utils/helpers.ts

export type ModifyDirection = 'plus' | 'minus';

/**
 * Заменяет все символы подчеркивания на пробелы.
 */
export function formatUnderscores(str: string): string {
    return str.replace(/_/g, ' ');
}

/**
 * Форматирует строку в регистр заголовков (Title Case).
 */
export function toTitleCase(str: string): string {
    return formatUnderscores(str).replace(/(^\w|\s\w)/g, (match) =>
        match.toUpperCase(),
    );
}

/**
 * Модифицирует цену ISK по официальному правилу 4 значащих цифр EVE Online.
 * Математический расчет точности заменяет тяжелый и медленный .split('.')
 */
export function calculateModifiedIsk(
    price: number,
    direction: ModifyDirection,
): string {
    if (price <= 0 || isNaN(price)) return '0';

    const magnitude = Math.floor(Math.log10(price));
    let step = Math.pow(10, magnitude - 3);
    let modifiedPrice = direction === 'plus' ? price + step : price - step;

    const newMagnitude = Math.floor(Math.log10(modifiedPrice));
    if (newMagnitude < magnitude) {
        step = Math.pow(10, newMagnitude - 3);
        modifiedPrice = direction === 'plus' ? price + step : price - step;
    }

    if (step >= 1) {
        modifiedPrice = Math.round(modifiedPrice / step) * step;
        return Math.floor(modifiedPrice).toString();
    } else {
        // Шаг в EVE не падает ниже 0.01 (2 знака) и равен 0.1 при 1 знаке
        const precision = step < 0.09 ? 2 : 1;
        modifiedPrice = Math.round(modifiedPrice / step) * step;
        return modifiedPrice.toFixed(precision);
    }
}

/**
 * Внутренний оптимизированный хелпер для безопасного взаимодействия с Web Storage API.
 */
function getStorageItem<T>(
    storageType: 'localStorage' | 'sessionStorage',
    key: string,
): T | null {
    if (typeof window === 'undefined') return null;
    try {
        const item = window[storageType].getItem(key);
        return item ? (JSON.parse(item) as T) : null;
    } catch (error) {
        console.error(`Ошибка чтения из ${storageType}:`, error);
        return null;
    }
}

/**
 * Внутренний оптимизированный хелпер для безопасной записи в Web Storage API.
 */
function setStorageItem<T>(
    storageType: 'localStorage' | 'sessionStorage',
    key: string,
    value: T,
): void {
    if (typeof window === 'undefined') return;
    try {
        window[storageType].setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Ошибка записи в ${storageType}:`, error);
    }
}

/**
 * Запись данных в LocalStorage с автоматической сериализацией в JSON.
 */
export function setToStorage<T>(key: string, value: T): void {
    setStorageItem('localStorage', key, value);
}

/**
 * Чтение данных из LocalStorage с автоматическим парсингом JSON.
 */
export function getFromStorage<T>(key: string): T | null {
    return getStorageItem('localStorage', key);
}

/**
 * Запись сессионных данных в SessionStorage (живет строго в рамках текущей вкладки).
 */
export function setToSession<T>(key: string, value: T): void {
    setStorageItem('sessionStorage', key, value);
}

/**
 * Чтение сессионных данных из SessionStorage с автоматическим парсингом JSON.
 */
export function getFromSession<T>(key: string): T | null {
    return getStorageItem('sessionStorage', key);
}

/**
 * Высокопроизводительное копирование в буфер обмена с мгновенной DOM-мутацией текста кнопки.
 * Полностью изолирует визуальный фидбек [Copied] от тяжелых ререндеров React-таблиц.
 */
export function copyToClipboardWithFeedback(
    button: HTMLButtonElement,
    textToCopy: string,
    copiedClass?: string,
): void {
    navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
            const originalText = button.textContent;
            button.textContent = '[Copied]';
            button.style.pointerEvents = 'none'; // Защита от дребезга (спам-кликов)
            if (copiedClass) {
                button.classList.add(copiedClass);
            }

            setTimeout(() => {
                button.textContent = originalText;
                button.style.pointerEvents = '';
                if (copiedClass) {
                    button.classList.remove(copiedClass);
                }
            }, 1000);
        })
        .catch((err) => {
            console.error('Не удалось скопировать данные в буфер:', err);
        });
}
