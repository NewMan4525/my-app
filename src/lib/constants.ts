import { IHubs, ITIME } from '@/src/types/interfaces';

export const HUBS: IHubs = {
    the_forge: {
        region: { alias: 'the_forge', name: 'The Forge', id: 10000002 },
        system: { name: 'Jita', id: 30000142 },
        station: {
            name: 'Jita IV - Moon 4 - Caldari Navy Assembly Plant',
            id: 60003760,
        },
        owners: {
            corporation: {
                alias: 'caldari_navy',
                name: 'Caldari Navy',
            },
            faction: {
                alias: 'concord',
                name: 'Concord',
            },
        },
    },
    domain: {
        region: { alias: 'domain', name: 'Domain', id: 10000043 },
        system: { name: 'Amarr', id: 30002187 },
        station: {
            name: 'Amarr VIII (Oris) - Family Academy',
            id: 60008494,
        },
        owners: {
            corporation: {
                alias: 'emperor_family',
                name: 'Emperor Family',
            },
            faction: {
                alias: 'amarr',
                name: 'Amarr',
            },
        },
    },
    sinq_laison: {
        region: { alias: 'sinq_laison', name: 'Sinq Laison', id: 10000032 },
        system: { name: 'Dodixie', id: 30002659 },
        station: {
            name: 'Dodixie IX - Moon 20 - Federation Navy Assembly Plant',
            id: 60011866,
        },
        owners: {
            corporation: {
                alias: 'federation_navy',
                name: 'Federation Navy',
            },
            faction: {
                alias: 'gallente',
                name: 'Gallente',
            },
        },
    },
    metropolis: {
        region: { alias: 'metropolis', name: 'Metropolis', id: 10000042 },
        system: { name: 'Hek', id: 30002053 },
        station: {
            name: 'Hek VIII - Moon 12 - Boundless Creation Factory',
            id: 60011866,
        },
        owners: {
            corporation: {
                alias: ' boundless_creation',
                name: ' Boundless Creation',
            },
            faction: {
                alias: 'minmatar',
                name: 'Minmatar',
            },
        },
    },
    heimatar: {
        region: { alias: 'heimatar', name: 'Heimatar', id: 10000030 },
        system: { name: 'Rens', id: 30002510 },
        station: {
            name: 'Rens VI - Moon 8 - Brutor Tribe Treasury',
            id: 60004588,
        },
        owners: {
            corporation: {
                alias: ' brutor_tribe',
                name: ' Brutor Tribe',
            },
            faction: {
                alias: 'minmatar',
                name: 'Minmatar',
            },
        },
    },
};

export const BASE_URL: string = `https://esi.evetech.net/`;
// Milliseconds for common time periods
export const TIME: ITIME = {
    quartal: 7776000000,
    month: 2592000000,
    week: 604800000,
    day: 86400000,
};
export const USER_SETTINGS_KEY = 'user_settings';
