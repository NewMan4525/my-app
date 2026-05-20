// components-feature/optionsBar.tsx
'use client';

import { useState, FormEvent } from 'react';
import styles from './css/optionsBar.module.css';
import InputsBlock from './inputsBlock';
import { HUBS, TIME } from '@/src/lib/constants';
import { tradeSettings as defaultTradeSettings } from '@/src/lib/settings';
import { InputsBlockOptionCreator } from '@/src/utils/classes';
import { setToStorage, getFromStorage } from '@/src/utils/storage';
import { ITradeSettings } from '@/src/types/interfaces';

// Генератор стейта на основе настроек (из localStorage или дефолтов бэкенда)
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
        type_station_create_orders: current.marketPlaceisCitadel
            ? 'citadel'
            : 'npc_station',
        history_time_period: current.time,
    };
};

export default function OptionBar() {
    const [formValues, setFormValues] = useState<
        Record<string, number | string>
    >(() => {
        if (typeof window !== 'undefined') {
            const saved = getFromStorage<ITradeSettings>('trade_settings');
            return getTradeValues(saved);
        }
        return getTradeValues(null);
    });

    const handleNumberChange = (name: string, value: number) => {
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    // components-feature/optionsBar.tsx

    const handleRadioChange = (groupName: string, value: number) => {
        const cleanGroupName = groupName.replace(/\d+$/, '');

        if (
            cleanGroupName === 'skills_broker_relationship' ||
            cleanGroupName === 'skills_advanced_broker_relationship' ||
            cleanGroupName === 'skills_accounting'
        ) {
            setFormValues((prev) => ({ ...prev, [groupName]: value }));
            return;
        }

        // 1. Строгая проверка для РЕГИОНОВ (работаем конкретно с marketplace0)
        if (groupName === 'marketplace0') {
            const hubKeys = Object.keys(HUBS);
            const selectedRegion = HUBS[hubKeys[value - 1]].region.alias;
            setFormValues((prev) => ({
                ...prev,
                region_create_orders: selectedRegion,
            }));
            return;
        }

        // 2. Строгая проверка для ТИПА СТАНЦИЙ (работаем конкретно с marketplace1)
        if (groupName === 'marketplace1') {
            if (value === 1) {
                setFormValues((prev) => ({
                    ...prev,
                    type_station_create_orders: 'citadel',
                }));
            } else if (value === 2) {
                setFormValues((prev) => ({
                    ...prev,
                    type_station_create_orders: 'npc_station',
                }));
            }
            return;
        }

        // 3. Для периодов времени (Time)
        if (groupName.startsWith('time')) {
            const timeKeys = Object.keys(TIME);
            const selectedTime = timeKeys[value - 1];
            setFormValues((prev) => ({
                ...prev,
                history_time_period: selectedTime,
            }));
        }
    };

    const handleReset = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Сброс до дефолтов бэкенда
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
            marketPlaceisCitadel:
                formValues['type_station_create_orders'] === 'citadel',
        };

        setToStorage<ITradeSettings>('trade_settings', updatedTradeSettings);
    };

    // ... Логика castedValues и разметки settings остается прежней ...
    const castedValues: Record<string, number> = {};
    Object.keys(formValues).forEach((key) => {
        const val = formValues[key];
        if (typeof val === 'string') {
            if (key === 'region_create_orders') {
                castedValues['marketplace0'] =
                    Object.keys(HUBS).findIndex(
                        (h) => HUBS[h].region.alias === val,
                    ) + 1;
            } else if (key === 'type_station_create_orders') {
                castedValues['marketplace1'] = val === 'citadel' ? 1 : 2;
            } else if (key === 'history_time_period') {
                castedValues['time0'] = Object.keys(TIME).indexOf(val) + 1;
            }
        } else {
            castedValues[key] = val;
        }
    });

    const settings: InputsBlockOptionCreator[] = [
        new InputsBlockOptionCreator('price', [
            {
                type: 'number',
                options: [
                    {
                        name: 'price',
                        text: 'minimum',
                        defaultValue: Number(formValues['price0']),
                    },
                ],
            },
            {
                type: 'number',
                options: [
                    {
                        name: 'price',
                        text: 'maximum',
                        defaultValue: Number(formValues['price1']),
                    },
                ],
            },
        ]),
        new InputsBlockOptionCreator('volume', [
            {
                type: 'number',
                options: [
                    {
                        name: 'volume',
                        text: 'minimum',
                        defaultValue: Number(formValues['volume0']),
                    },
                ],
            },
            {
                type: 'number',
                options: [
                    {
                        name: 'volume',
                        text: 'maximum',
                        defaultValue: Number(formValues['volume1']),
                    },
                ],
            },
        ]),
        new InputsBlockOptionCreator('orders', [
            {
                type: 'number',
                options: [
                    {
                        name: 'orders',
                        text: 'minimum',
                        defaultValue: Number(formValues['orders0']),
                    },
                ],
            },
            {
                type: 'number',
                options: [
                    {
                        name: 'orders',
                        text: 'maximum',
                        defaultValue: Number(formValues['orders1']),
                    },
                ],
            },
        ]),
        new InputsBlockOptionCreator('margin', [
            {
                type: 'number',
                options: [
                    {
                        name: 'margin',
                        text: 'minimum',
                        defaultValue: Number(formValues['margin0']),
                    },
                ],
            },
            {
                type: 'number',
                options: [
                    {
                        name: 'margin',
                        text: 'maximum',
                        defaultValue: Number(formValues['margin1']),
                    },
                ],
            },
        ]),
        new InputsBlockOptionCreator('marketplace', [
            {
                type: 'radio',
                options: Array.from(
                    { length: Object.keys(HUBS).length },
                    (_, i) => {
                        const regionAlias =
                            HUBS[Object.keys(HUBS)[i]].region.alias;
                        return {
                            groupName: 'region_create_orders',
                            name: 'marketplace',
                            text: regionAlias,
                            defaultChecked:
                                regionAlias ===
                                formValues['region_create_orders'],
                        };
                    },
                ),
            },
            {
                type: 'radio',
                options: [
                    {
                        groupName: 'type_station_create_orders',
                        name: 'marketplace',
                        text: 'citadel',
                        defaultChecked:
                            formValues['type_station_create_orders'] ===
                            'citadel',
                    },
                    {
                        groupName: 'type_station_create_orders',
                        name: 'marketplace',
                        text: 'npc_station',
                        defaultChecked:
                            formValues['type_station_create_orders'] ===
                            'npc_station',
                    },
                ],
            },
        ]),
        new InputsBlockOptionCreator('time', [
            {
                type: 'radio',
                options: Array.from(
                    { length: Object.keys(TIME).length },
                    (_, i) => {
                        const timeKey = Object.keys(TIME)[i];
                        return {
                            groupName: 'history_time_period',
                            name: 'time',
                            text: timeKey,
                            defaultChecked:
                                timeKey === formValues['history_time_period'],
                        };
                    },
                ),
            },
        ]),
        new InputsBlockOptionCreator('', [
            {
                type: 'reset',
                options: [{ name: 'cancel_options', defaultValue: 'cancel' }],
            },
            {
                type: 'submit',
                options: [
                    {
                        name: 'accept_options',
                        defaultValue: 'OK',
                    },
                ],
            },
        ]),
    ];

    return (
        <form
            onSubmit={handleSubmit}
            onReset={handleReset}
            className={`${styles.container} container`}
        >
            <h2 className={styles.h2}>Market options</h2>
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
