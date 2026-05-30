// ./src/components-feature/userForm.tsx
'use client';

import { useState, FormEvent, useMemo } from 'react';
import styles from '@/src/app/user/user.module.css';
import InputsBlock from '@/src/components-feature/inputsBlock';

import {
    HUBS,
    userStats as defaultUserStats,
    userSkills as defaultUserSkills,
} from '@/src/lib/constants';
import { setToStorage, getFromStorage } from '@/src/utils/helpers';
import { IUserStats } from '@/src/types/interfaces';
import { IUserSkills } from '@/src/types/frontInterfaces';
import { buildUserPresets } from '@/src/utils/presets/userOptions';

const HUB_KEYS = [
    'the_forge',
    'domain',
    'sinq_laison',
    'metropolis',
    'heimatar',
];

const getUserValues = (
    savedStats: IUserStats | null,
    savedSkills: IUserSkills | null,
) => {
    const initial: Record<string, number> = {};
    const len = HUB_KEYS.length;

    for (let i = 0; i < len; i++) {
        const key = HUB_KEYS[i];
        const regionName = HUBS[key].region.alias;
        initial[`${regionName}_factionStand0`] =
            savedStats?.[regionName]?.factionStand ??
            defaultUserStats[regionName]?.factionStand ??
            0;
        initial[`${regionName}_stationOwnerStand1`] =
            savedStats?.[regionName]?.stationOwnerStand ??
            defaultUserStats[regionName]?.stationOwnerStand ??
            0;
    }

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

export default function UserForm() {
    const [formValues, setFormValues] = useState<Record<string, number>>(() => {
        const savedStats = getFromStorage<IUserStats>('user_stats');
        const savedSkills = getFromStorage<IUserSkills>('user_skills');
        return getUserValues(savedStats, savedSkills);
    });

    const handleNumberChange = (name: string, value: number) => {
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleRadioChange = (groupName: string, value: number) => {
        setFormValues((prev) => ({ ...prev, [groupName]: value }));
    };

    const handleReset = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormValues(getUserValues(null, null));
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const updatedStats: IUserStats = {};
        const len = HUB_KEYS.length;

        for (let i = 0; i < len; i++) {
            const key = HUB_KEYS[i];
            const regionName = HUBS[key].region.alias;
            updatedStats[regionName] = {
                factionStand: formValues[`${regionName}_factionStand0`] ?? 0,
                stationOwnerStand:
                    formValues[`${regionName}_stationOwnerStand1`] ?? 0,
            };
        }

        const updatedSkills: IUserSkills = {
            broker_relationship: formValues['skills_broker_relationship0'] ?? 1,
            advanced_broker_relationship:
                formValues['skills_advanced_broker_relationship1'] ?? 1,
            accounting: formValues['skills_accounting2'] ?? 1,
        };

        setToStorage<IUserStats>('user_stats', updatedStats);
        setToStorage<IUserSkills>('user_skills', updatedSkills);
        console.log('User stats and skills successfully saved.');
    };

    const settings = useMemo(() => buildUserPresets(formValues), [formValues]);

    return (
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
    );
}
