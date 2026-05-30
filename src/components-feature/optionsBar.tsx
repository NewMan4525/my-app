// ./src/components-feature/optionsBar.tsx
'use client';

import { useState, FormEvent, useMemo } from 'react';
import styles from './css/optionsBar.module.css';
import InputsBlock from './inputsBlock';
import { tradeSettings as defaultTradeSettings } from '@/src/lib/constants';
import { setToStorage, getFromStorage } from '@/src/utils/helpers';
import { ITradeSettings } from '@/src/types/interfaces';
import { buildMarketSettingsPresets } from '@/src/utils/presets/marketOptions';

const HUB_KEYS = [
    'the_forge',
    'domain',
    'sinq_laison',
    'metropolis',
    'heimatar',
];
const TIME_KEYS = ['quartal', 'month', 'week', 'day'];

const getTradeValues = (saved: ITradeSettings | null) => {
    const current = saved ?? defaultTradeSettings;
    return {
        price0: current.priceMin,
        price1: current.priceMax,
        volume0: current.volumeMin,
        volume1: current.volumeMax,
        orders0: current.ordersMin,
        orders1: current.ordersMax,
        margin0: current.marginMin,
        margin1: current.marginMax,
        region_create_orders: current.region,
        type_station_buy: current.marketPlaceBuyIsCitadel
            ? 'citadel'
            : 'npc_station',
        type_station_sell: current.marketPlaceSellIsCitadel
            ? 'citadel'
            : 'npc_station',
        history_time_period: current.time,
    };
};

export default function OptionBar() {
    const [formValues, setFormValues] = useState<
        Record<string, number | string>
    >(() => {
        const saved = getFromStorage<ITradeSettings>('trade_settings');
        return getTradeValues(saved);
    });

    const handleNumberChange = (name: string, value: number) => {
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleRadioChange = (groupName: string, value: number) => {
        const cleanGroupName = groupName.replace(/\d+$/, '');

        if (groupName === 'marketplace0') {
            setFormValues((prev) => ({
                ...prev,
                region_create_orders: HUB_KEYS[value - 1],
            }));
            return;
        }
        if (groupName === 'marketplace1') {
            setFormValues((prev) => ({
                ...prev,
                type_station_buy: value === 1 ? 'citadel' : 'npc_station',
            }));
            return;
        }
        if (groupName === 'marketplace2') {
            setFormValues((prev) => ({
                ...prev,
                type_station_sell: value === 1 ? 'citadel' : 'npc_station',
            }));
            return;
        }
        if (cleanGroupName === 'time') {
            setFormValues((prev) => ({
                ...prev,
                history_time_period: TIME_KEYS[value - 1],
            }));
        }
    };

    const handleReset = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormValues(getTradeValues(null));
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const updatedTradeSettings: ITradeSettings = {
            region: String(formValues['region_create_orders']),
            time: String(formValues['history_time_period']),
            priceMin: Number(formValues['price0']),
            priceMax: Number(formValues['price1']),
            marginMin: Number(formValues['margin0']),
            marginMax: Number(formValues['margin1']),
            volumeMin: Number(formValues['volume0']),
            volumeMax: Number(formValues['volume1']),
            ordersMin: Number(formValues['orders0']),
            ordersMax: Number(formValues['orders1']),
            TAX: defaultTradeSettings.TAX,
            FEES: defaultTradeSettings.FEES,
            marketPlaceBuyIsCitadel:
                formValues['type_station_buy'] === 'citadel',
            marketPlaceSellIsCitadel:
                formValues['type_station_sell'] === 'citadel',
        };
        setToStorage<ITradeSettings>('trade_settings', updatedTradeSettings);
        window.dispatchEvent(new CustomEvent('refresh-info-panel'));
    };

    const castedValues = useMemo(() => {
        const result: Record<string, number> = {};
        for (const key in formValues) {
            const val = formValues[key];
            if (typeof val === 'string') {
                if (key === 'region_create_orders')
                    result['marketplace0'] = HUB_KEYS.indexOf(val) + 1;
                else if (key === 'type_station_buy')
                    result['marketplace1'] = val === 'citadel' ? 1 : 2;
                else if (key === 'type_station_sell')
                    result['marketplace2'] = val === 'citadel' ? 1 : 2;
                else if (key === 'history_time_period')
                    result['time0'] = TIME_KEYS.indexOf(val) + 1;
            } else result[key] = val;
        }
        return result;
    }, [formValues]);

    const settings = useMemo(
        () => buildMarketSettingsPresets(castedValues),
        [castedValues],
    );

    return (
        <form
            onSubmit={handleSubmit}
            onReset={handleReset}
            className={`${styles.container} container`}
        >
            <h2 className={styles.h2}>Market Options</h2>
            {settings.map((item, i) => (
                <InputsBlock
                    key={i}
                    h3={item.h3}
                    inputsProps={item.inputsProps}
                    values={castedValues}
                    onNumberChange={handleNumberChange}
                    onRadioChange={handleRadioChange}
                />
            ))}
        </form>
    );
}
