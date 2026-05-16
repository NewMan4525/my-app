import styles from './css/optionsBar.module.css';
import InputsBlock from './inputsBlock';
import { HUBS, TIME } from '@/src/lib/constants';
import { tradeSettings } from '@/src/lib/settings';
import { InputsBlockOptionCreator } from '@/src/lib_front/classes';

export default function OptionBar() {
    const settings: InputsBlockOptionCreator[] = [
        new InputsBlockOptionCreator('price', [
            {
                type: 'number',
                options: [
                    {
                        name: 'price',
                        text: 'minimum',
                        defaultValue: tradeSettings.priceMin,
                    },
                ],
            },
            {
                type: 'number',
                options: [
                    {
                        name: 'price',
                        text: 'maximum',
                        defaultValue: tradeSettings.priceMax,
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
                        defaultValue: tradeSettings.volumeMin,
                    },
                ],
            },
            {
                type: 'number',
                options: [
                    {
                        name: 'volume',
                        text: 'maximum',
                        defaultValue: tradeSettings.volumeMax,
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
                        defaultValue: tradeSettings.ordersMin,
                    },
                ],
            },
            {
                type: 'number',
                options: [
                    {
                        name: 'orders',
                        text: 'maximum',
                        defaultValue: tradeSettings.ordersMax,
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
                        defaultValue: tradeSettings.marginMin,
                    },
                ],
            },
            {
                type: 'number',
                options: [
                    {
                        name: 'margin',
                        text: 'maximum',
                        defaultValue: tradeSettings.marginMax,
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
                        return {
                            groupName: 'region_create_orders',
                            name: 'marketplace',
                            text: HUBS[Object.keys(HUBS)[i]].region.alias,
                            defaultChecked:
                                HUBS[Object.keys(HUBS)[i]].region.alias ===
                                tradeSettings.region,
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
                        defaultChecked: tradeSettings.marketPlaceisCitadel,
                    },
                    {
                        groupName: 'type_station_create_orders',
                        name: 'marketplace',
                        text: 'npc_station',
                        defaultChecked: !tradeSettings.marketPlaceisCitadel,
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
                        return {
                            groupName: 'history_time_period',
                            name: 'time',
                            text: Object.keys(TIME)[i],
                            defaultChecked:
                                Object.keys(TIME)[i] === tradeSettings.time,
                        };
                    },
                ),
            },
        ]),
        new InputsBlockOptionCreator('', [
            {
                type: 'button',
                options: [
                    {
                        name: 'accept_options',
                        defaultValue: 'cancel',
                    },
                ],
            },
            {
                type: 'button',
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
        <div className={styles.overview}>
            <div className={`${styles.container} container`}>
                <h2 className={styles.h2}>Market options</h2>
                {settings.map((item, i) => (
                    <InputsBlock
                        key={i}
                        h3={item.h3}
                        inputsProps={item.inputsProps}
                    />
                ))}
            </div>
        </div>
    );
}
