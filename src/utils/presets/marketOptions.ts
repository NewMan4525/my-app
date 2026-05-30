// ./src/utils/presets/marketOptions.ts
import { InputsBlockOptionCreator } from '@/src/utils/classes';

export const buildMarketSettingsPresets = (
    formValues: Record<string, number | string>,
) => {
    return [
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
                options: [
                    'the_forge',
                    'domain',
                    'sinq_laison',
                    'metropolis',
                    'heimatar',
                ].map((h, idx) => ({
                    groupName: 'Hub region',
                    name: 'marketplace',
                    text: h
                        .replace(/_/g, ' ')
                        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase()), // Быстрый инлайн Title Case
                    defaultChecked:
                        Number(formValues['marketplace0']) === idx + 1,
                })),
            },
            {
                type: 'radio',
                options: [
                    {
                        groupName: 'Buy Station',
                        name: 'marketplace',
                        text: 'Citadel',
                        defaultChecked:
                            Number(formValues['marketplace1']) === 1,
                    },
                    {
                        groupName: 'Buy Station',
                        name: 'marketplace',
                        text: 'NPC Station',
                        defaultChecked:
                            Number(formValues['marketplace1']) === 2,
                    },
                ],
            },
            {
                type: 'radio',
                options: [
                    {
                        groupName: 'Sell Station',
                        name: 'marketplace',
                        text: 'Citadel',
                        defaultChecked:
                            Number(formValues['marketplace2']) === 1,
                    },
                    {
                        groupName: 'Sell Station',
                        name: 'marketplace',
                        text: 'NPC Station',
                        defaultChecked:
                            Number(formValues['marketplace2']) === 2,
                    },
                ],
            },
        ]),
        new InputsBlockOptionCreator('time_period', [
            {
                type: 'radio',
                options: ['quartal', 'month', 'week', 'day'].map((t, idx) => ({
                    groupName: 'History time period',
                    name: 'time',
                    text: t,
                    defaultChecked: Number(formValues['time0']) === idx + 1,
                })),
            },
        ]),
        new InputsBlockOptionCreator('', [
            {
                type: 'reset',
                options: [{ name: 'cancel_options', defaultValue: 'cancel' }],
            },
            {
                type: 'submit',
                options: [{ name: 'accept_options', defaultValue: 'OK' }],
            },
        ]),
    ];
};
