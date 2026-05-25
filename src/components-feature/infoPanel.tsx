// ./src/components-feature/infoPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import styles from './css/info_panel.module.css';
import { getFromStorage } from '@/src/utils/storage';
import { ITradeSettings } from '@/src/types/interfaces';
import { HUBS } from '@/src/lib/constants';

interface InfoPanelProps {
    isPending: boolean;
}

export default function InfoPanel({ isPending }: InfoPanelProps) {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const handleRefresh = () => setTick((prev) => prev + 1);
        window.addEventListener('refresh-info-panel', handleRefresh);
        return () =>
            window.removeEventListener('refresh-info-panel', handleRefresh);
    }, []);

    const marketSettings = getFromStorage<ITradeSettings>('trade_settings');

    const renderContent = () => {
        if (!marketSettings)
            return <p>No settings saved. Configure options and click OK.</p>;

        const currentHub = Object.values(HUBS).find(
            (h) => h.region.alias === marketSettings.region,
        );
        const regionName = currentHub
            ? `${currentHub.region.name} (${currentHub.system.name})`
            : marketSettings.region;

        // Раздельный текстовый вывод статусов станций
        const buyStationType = marketSettings.marketPlaceBuyIsCitadel
            ? 'Citadel'
            : 'NPC Station';
        const sellStationType = marketSettings.marketPlaceSellIsCitadel
            ? 'Citadel'
            : 'NPC Station';

        return (
            <>
                <div className={styles.renderContent}>
                    <div className={styles.infoPart}>
                        <h4>Marketplace</h4>
                        <p>
                            <strong>Hub:</strong> {regionName}
                        </p>
                        <p>
                            <strong>Setup:</strong> Buy in [{buyStationType}] ➔
                            Sell in [{sellStationType}]
                        </p>
                    </div>
                    <div className={styles.infoPart}>
                        <h4>Market settings</h4>
                        <p>
                            <strong>Price limit:</strong>{' '}
                            {marketSettings.priceMin.toLocaleString()} -{' '}
                            {marketSettings.priceMax.toLocaleString()} ISK
                        </p>
                        <p>
                            <strong>Volume limit:</strong>{' '}
                            {marketSettings.volumeMin} -{' '}
                            {marketSettings.volumeMax}
                        </p>
                        <p>
                            <strong>Margin limit:</strong>{' '}
                            {marketSettings.marginMin}% -{' '}
                            {marketSettings.marginMax}%
                        </p>
                    </div>
                    <div className={styles.infoPart}>
                        <h4>Other</h4>
                        <p>
                            <strong>Time Period:</strong> {marketSettings.time}
                        </p>
                        <p>
                            <strong>current comission:</strong>
                            <span>0.0</span>
                        </p>
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className={styles.contentInfo}>
            <div className={styles.info_area}>{renderContent()}</div>
            <div className={styles.leadInfo}>
                <button
                    data-action="get-data"
                    className={styles.info_button}
                    disabled={isPending}
                >
                    {isPending ? '...Loading' : 'Get Data'}
                </button>
            </div>
        </div>
    );
}
