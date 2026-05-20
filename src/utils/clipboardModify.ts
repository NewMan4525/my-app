// src/utils/clipboardModify.ts

export type ModifyDirection = 'plus' | 'minus';

/**
 * Модифицирует цену ISK по официальному правилу 4 значащих цифр EVE Online (Патч Broker Relations).
 * Изменяет наименьший значащий разряд (4-ю цифру) на единицу вверх или вниз.
 *
 * Пример: 181 600 000 -> direction: 'plus' -> 181 700 000
 *
 * @param price Исходная цена предмета
 * @param direction 'plus' — для Buy-ордеров (перебить чужую ставку), 'minus' — для Sell-ордеров (выставить дешевле)
 * @returns Строка с валидной модифицированной ценой для буфера обмена
 */
export function calculateModifiedIsk(
    price: number,
    direction: ModifyDirection,
): string {
    if (price <= 0 || isNaN(price)) return '0';

    // 1. Получаем порядок числа (разрядность), чтобы найти масштаб
    // Например, для 181600000 -> Math.log10(181600000) ≈ 8.259 -> Math.floor(8.259) = 8
    const magnitude = Math.floor(Math.log10(price));

    // 2. Рассчитываем вес 4-й значащей цифры (шаг изменения)
    // Формула: 10^(magnitude - 3).
    // Для 181600000: magnitude = 8. Шаг = 10^(8 - 3) = 10^5 = 100 000 ISK.
    let step = Math.pow(10, magnitude - 3);

    // 3. Модифицируем цену на один полноценный игровой шаг значащего разряда
    let modifiedPrice = direction === 'plus' ? price + step : price - step;

    // 4. Защита: если при вычитании (minus) порядок числа уменьшился (например, упали с 1000 до 999),
    // шаг пересчитывается заново, чтобы не нарушить структуру 4 значащих цифр.
    const newMagnitude = Math.floor(Math.log10(modifiedPrice));
    if (newMagnitude < magnitude) {
        step = Math.pow(10, newMagnitude - 3);
        modifiedPrice = direction === 'plus' ? price + step : price - step;
    }

    // 5. Жестко округляем результат до размера вычисленного шага, зануляя все лишние "хвосты"
    // Для цен меньше 10.0 шаг может быть дробным (0.01), для больших чисел - строго целым (100000).
    if (step >= 1) {
        // Округляем до ближайшего кратного шагу целого числа, убирая мусор
        modifiedPrice = Math.round(modifiedPrice / step) * step;
        return Math.floor(modifiedPrice).toString();
    } else {
        // Если предмет стоит копейки и шаг дробный (0.1 или 0.01), сохраняем плавающую точку
        const precision = step.toString().split('.')[1]?.length || 2;
        modifiedPrice = Math.round(modifiedPrice / step) * step;
        return modifiedPrice.toFixed(precision);
    }
}
