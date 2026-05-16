import styles from './user.module.css';
import InputsBlock from '@/src/components-feature/inputsBlock';
import { HUBS } from '@/src/lib/constants';
import { userStats } from '@/src/lib/settings';
import { InputsBlockOptionCreator } from '@/src/lib_front/classes';
export default function User() {
    const txt = ' stand';
    const settings = [
        ...Array.from({ length: Object.keys(HUBS).length }, (_, i) => {
            const regionName = HUBS[Object.keys(HUBS)[i]].region.alias;
            const factionOwner =
                HUBS[Object.keys(HUBS)[i]].owners.faction.alias;
            const stationOwner =
                HUBS[Object.keys(HUBS)[i]].owners.corporation.alias;
            return new InputsBlockOptionCreator(regionName, [
                {
                    type: 'number',
                    options: [
                        {
                            name: regionName,
                            text: factionOwner + txt,
                            defaultValue: userStats[regionName].factionStand,
                        },
                    ],
                },
                {
                    type: 'number',
                    options: [
                        {
                            name: regionName,
                            text: stationOwner + txt,
                            defaultValue:
                                userStats[regionName].stationOwnerStand,
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
                        i++;
                        return {
                            groupName: 'broker_relationship',
                            name: 'skills_broker_relationship',
                            text: 'lvl' + ' ' + i,
                            defaultChecked: i === 1,
                        };
                    }),
                },
                {
                    type: 'radio',
                    options: Array.from({ length: 5 }, (_, i) => {
                        i++;
                        return {
                            groupName: 'advanced_broker_relationship',
                            name: 'skills_advanced_broker_relationship',
                            text: 'lvl' + ' ' + i,
                            defaultChecked: i === 1,
                        };
                    }),
                },
                {
                    type: 'radio',
                    options: Array.from({ length: 5 }, (_, i) => {
                        i++;
                        return {
                            groupName: 'accounting',
                            name: 'skills_accounting',
                            text: 'lvl' + ' ' + i,
                            defaultChecked: i === 1,
                        };
                    }),
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
        ],
    ];

    return (
        <section>
            <div className={`${styles.container} container`}>
                <h2 className={styles.h2}>User stats</h2>
                {settings.map((item, i) => (
                    <InputsBlock
                        key={i}
                        h3={item.h3}
                        inputsProps={item.inputsProps}
                    />
                ))}
            </div>
        </section>
    );
}
