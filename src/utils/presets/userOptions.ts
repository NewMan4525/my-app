// ./src/utils/presets/userOptions.ts
import { InputsBlockOptionCreator } from '@/src/utils/classes';
import { HUBS } from '@/src/lib/constants';

const HUB_KEYS = [
    'the_forge',
    'domain',
    'sinq_laison',
    'metropolis',
    'heimatar',
];

export const buildUserPresets = (formValues: Record<string, number>) => {
    const txt = ' stand';
    const len = HUB_KEYS.length;
    const result = new Array<InputsBlockOptionCreator>(len + 2);

    // Генерируем блоки стендингов (Фракция + Корпорация) для каждого хаба
    for (let i = 0; i < len; i++) {
        const regionKey = HUB_KEYS[i];
        const regionName = HUBS[regionKey].region.alias;
        const factionOwner = HUBS[regionKey].owners.faction.alias;
        const stationOwner = HUBS[regionKey].owners.corporation.alias;

        result[i] = new InputsBlockOptionCreator(regionName, [
            {
                type: 'number',
                options: [
                    {
                        name: `${regionName}_factionStand`,
                        text: factionOwner + txt,
                        defaultValue: formValues[`${regionName}_factionStand0`],
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
    }
    const SKILLS_LVL_COUNT = 5;
    const brokerOptions = new Array(SKILLS_LVL_COUNT);
    const advBrokerOptions = new Array(SKILLS_LVL_COUNT);
    const accountingOptions = new Array(SKILLS_LVL_COUNT);

    for (let i = 0; i < SKILLS_LVL_COUNT; i++) {
        const lvl = i + 1;
        brokerOptions[i] = {
            groupName: 'broker_relationship',
            name: 'skills_broker_relationship',
            text: 'lvl ' + lvl,
            defaultChecked: lvl === formValues['skills_broker_relationship0'],
        };
        advBrokerOptions[i] = {
            groupName: 'advanced_broker_relationship',
            name: 'skills_advanced_broker_relationship',
            text: 'lvl ' + lvl,
            defaultChecked:
                lvl === formValues['skills_advanced_broker_relationship1'],
        };
        accountingOptions[i] = {
            groupName: 'accounting',
            name: 'skills_accounting',
            text: 'lvl ' + lvl,
            defaultChecked: lvl === formValues['skills_accounting2'],
        };
    }

    result[len] = new InputsBlockOptionCreator('skills_lvl', [
        { type: 'radio', options: brokerOptions },
        { type: 'radio', options: advBrokerOptions },
        { type: 'radio', options: accountingOptions },
    ]);

    result[len + 1] = new InputsBlockOptionCreator('', [
        {
            type: 'reset',
            options: [{ name: 'cancel_options', defaultValue: 'cancel' }],
        },
        {
            type: 'submit',
            options: [{ name: 'accept_options', defaultValue: 'OK' }],
        },
    ]);

    return result;
};
