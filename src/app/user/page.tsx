// app/user/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import styles from './user.module.css';
import InputsBlock from '@/src/components-feature/inputsBlock';
import { HUBS } from '@/src/lib/constants';
import {
    userStats as defaultUserStats,
    userSkills as defaultUserSkills,
} from '@/src/lib/settings';
import { InputsBlockOptionCreator } from '@/src/lib_front/classes';
import { setToStorage, getFromStorage } from '@/src/utils/storage';
import { IUserStats } from '@/src/types/interfaces';
import { IUserSkills } from '@/src/types/frontInterfaces';

// Функция генерации значений. Принимает сохраненные данные, если они есть
const getUserValues = (
    savedStats: IUserStats | null,
    savedSkills: IUserSkills | null,
) => {
    const initial: { [key: string]: number } = {};

    // Заполняем стендингами (приоритет localStorage -> дефолты бэкенда)
    Object.keys(HUBS).forEach((key) => {
        const regionName = HUBS[key].region.alias;
        initial[`${regionName}_factionStand0`] =
            savedStats?.[regionName]?.factionStand ??
            defaultUserStats[regionName]?.factionStand ??
            0;
        initial[`${regionName}_stationOwnerStand1`] =
            savedStats?.[regionName]?.stationOwnerStand ??
            defaultUserStats[regionName]?.stationOwnerStand ??
            0;
    });

    // Заполняем скиллами (приоритет localStorage -> дефолты бэкенда)
    initial['skills_broker_relationship0'] =
        savedSkills?.broker_relationship ??
        defaultUserSkills.broker_relationship;
    initial['skills_advanced_broker_relationship1'] =
        savedSkills?.advanced_broker_relationship ??
        defaultUserSkills.advanced_broker_relationship;
    initial['skills_accounting2'] =
        savedSkills?.accounting ?? defaultUserSkills.accounting;

    return initial;
};

export default function User() {
    // Инициализируем стейт лениво, безопасно считывая localStorage на клиенте
    const [formValues, setFormValues] = useState<{ [key: string]: number }>(
        () => {
            if (typeof window !== 'undefined') {
                const savedStats = getFromStorage<IUserStats>('user_stats');
                const savedSkills = getFromStorage<IUserSkills>('user_skills');
                return getUserValues(savedStats, savedSkills);
            }
            // Серверный рендер (SSR) всегда получает чистые дефолты
            return getUserValues(null, null);
        },
    );

    const handleNumberChange = (name: string, value: number) => {
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleRadioChange = (groupName: string, value: number) => {
        setFormValues((prev) => ({ ...prev, [groupName]: value }));
    };

    const handleReset = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Кнопка Cancel сбрасывает строго до дефолтов бэкенда (игнорируя localStorage)
        setFormValues(getUserValues(null, null));
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const updatedStats: IUserStats = {};
        Object.keys(HUBS).forEach((key) => {
            const regionName = HUBS[key].region.alias;
            updatedStats[regionName] = {
                factionStand: formValues[`${regionName}_factionStand0`] ?? 0,
                stationOwnerStand:
                    formValues[`${regionName}_stationOwnerStand1`] ?? 0,
            };
        });

        const updatedSkills: IUserSkills = {
            broker_relationship: formValues['skills_broker_relationship0'] ?? 1,
            advanced_broker_relationship:
                formValues['skills_advanced_broker_relationship1'] ?? 1,
            accounting: formValues['skills_accounting2'] ?? 1,
        };

        setToStorage<IUserStats>('user_stats', updatedStats);
        setToStorage<IUserSkills>('user_skills', updatedSkills);
    };

    // ... Описание массива settings (билдера) остается полностью без изменений ...
    const txt = ' stand';
    const settings: InputsBlockOptionCreator[] = [
        ...Array.from({ length: Object.keys(HUBS).length }, (_, i) => {
            const regionKey = Object.keys(HUBS)[i];
            const regionName = HUBS[regionKey].region.alias;
            const factionOwner = HUBS[regionKey].owners.faction.alias;
            const stationOwner = HUBS[regionKey].owners.corporation.alias;

            return new InputsBlockOptionCreator(regionName, [
                {
                    type: 'number',
                    options: [
                        {
                            name: `${regionName}_factionStand`,
                            text: factionOwner + txt,
                            defaultValue:
                                formValues[`${regionName}_factionStand0`],
                        },
                    ],
                },
                {
                    type: 'number',
                    options: [
                        {
                            name: `${regionName}_stationOwnerStand`,
                            text: stationOwner + txt,
                            defaultValue:
                                formValues[`${regionName}_stationOwnerStand1`],
                        },
                    ],
                },
            ]);
        }),
        ...[
            new InputsBlockOptionCreator('skills_lvl', [
                {
                    type: 'radio',
                    options: Array.from({ length: 5 }, (_, i) => {
                        const lvl = i + 1;
                        return {
                            groupName: 'broker_relationship',
                            name: 'skills_broker_relationship',
                            text: 'lvl' + ' ' + lvl,
                            defaultChecked:
                                lvl ===
                                formValues['skills_broker_relationship0'],
                        };
                    }),
                },
                {
                    type: 'radio',
                    options: Array.from({ length: 5 }, (_, i) => {
                        const lvl = i + 1;
                        return {
                            groupName: 'advanced_broker_relationship',
                            name: 'skills_advanced_broker_relationship',
                            text: 'lvl' + ' ' + lvl,
                            defaultChecked:
                                lvl ===
                                formValues[
                                    'skills_advanced_broker_relationship1'
                                ],
                        };
                    }),
                },
                {
                    type: 'radio',
                    options: Array.from({ length: 5 }, (_, i) => {
                        const lvl = i + 1;
                        return {
                            groupName: 'accounting',
                            name: 'skills_accounting',
                            text: 'lvl' + ' ' + lvl,
                            defaultChecked:
                                lvl === formValues['skills_accounting2'],
                        };
                    }),
                },
            ]),
            new InputsBlockOptionCreator('', [
                {
                    type: 'reset', // Наш готовый компонент InputReset
                    options: [
                        { name: 'cancel_options', defaultValue: 'cancel' },
                    ],
                },
                {
                    type: 'submit',
                    options: [{ name: 'accept_options', defaultValue: 'OK' }],
                },
            ]),
        ],
    ];

    return (
        <section>
            <form
                onSubmit={handleSubmit}
                onReset={handleReset}
                className={`${styles.container} container`}
            >
                <h2 className={styles.h2}>User stats</h2>
                {settings.map((item, i) => (
                    <InputsBlock
                        key={i}
                        h3={item.h3}
                        inputsProps={item.inputsProps}
                        values={formValues}
                        onNumberChange={handleNumberChange}
                        onRadioChange={handleRadioChange}
                    />
                ))}
            </form>
        </section>
    );
}
