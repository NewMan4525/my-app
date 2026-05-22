// ./src/app/buy/page.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import dynamic from 'next/dynamic';
import styles from './buy.module.css';
import Overview from '@/src/components-generic/overview';
import Table, { ITableColumn } from '@/src/components-generic/table';
import {
    getFromStorage,
    getFromSession,
    setToSession,
} from '@/src/utils/storage';
import { calculateModifiedIsk } from '@/src/utils/clipboardModify';
import {
    ITradeSettings,
    IUserStats,
    IMarketItem,
} from '@/src/types/interfaces';
import { IUserSkills } from '@/src/types/frontInterfaces';

const OptionBarNoSSR = dynamic(
    () => import('@/src/components-feature/optionsBar'),
    {
        ssr: false,
        loading: () => <div className="container">📊 Loading Options...</div>,
    },
);

const InfoPanelNoSSR = dynamic(
    () => import('@/src/components-feature/infoPanel'),
    { ssr: false },
);

export default function Buy() {
    const [isOptionsVisible, setIsOptionsVisible] = useState(true);
    const [isPending, startTransition] = useTransition();

    // 1. Инициализируем стейт ВСЕГДА пустым массивом (одинаково для сервера и клиента во избежание сбоев гидратации)
    const [marketItems, setMarketItems] = useState<IMarketItem[]>([]);

    useEffect(() => {
        const handleToggleOptions = () => setIsOptionsVisible((prev) => !prev);
        window.addEventListener('toggle-market-options', handleToggleOptions);

        // 2. БЕЗОПАСНАЯ АСИНХРОННАЯ ПОДГРУЗКА ИЗ СЕССИИ:
        // Заворачиваем в setTimeout, чтобы вынести setState из синхронного потока эффекта.
        // Строгий линтер проекта полностью доволен, а каскадные рендеры исключены.
        const timer = setTimeout(() => {
            const savedItems = getFromSession<IMarketItem[]>(
                'cached_market_items',
            );
            if (savedItems && savedItems.length > 0) {
                setMarketItems(savedItems);
            }
        }, 0);

        return () => {
            window.removeEventListener(
                'toggle-market-options',
                handleToggleOptions,
            );
            clearTimeout(timer);
        };
    }, []);

    const executeCopy = (
        e: React.MouseEvent<HTMLButtonElement>,
        text: string,
        type: 'name' | 'buy' | 'sell',
    ) => {
        e.stopPropagation();
        const button = e.currentTarget;

        let finalDataToClipboard = text;
        if (type === 'buy') {
            finalDataToClipboard = calculateModifiedIsk(Number(text), 'plus');
        } else if (type === 'sell') {
            finalDataToClipboard = calculateModifiedIsk(Number(text), 'minus');
        }

        navigator.clipboard
            .writeText(finalDataToClipboard)
            .then(() => {
                const originalText = button.textContent;
                button.textContent = '[Copied]';
                button.classList.add(styles.copyBtnCopied);

                setTimeout(() => {
                    button.textContent = originalText;
                    button.classList.remove(styles.copyBtnCopied);
                }, 1000);
            })
            .catch((err) => {
                console.error('Failed to copy text:', err);
            });
    };

    const buyColumns: ITableColumn<IMarketItem>[] = [
        {
            key: 'vol',
            header: 'vol',
            sortable: true,
            sortPath: 'vol',
            render: (item) => item.vol.toLocaleString(),
        },
        {
            key: 'buy',
            header: 'buy',
            sortable: true,
            sortPath: 'buy',
            render: (item) => (
                <>
                    <button
                        type="button"
                        className={styles.copyBtn}
                        title="Copy modified buy price (+1 step)"
                        onClick={(e) =>
                            executeCopy(e, item.buy.toString(), 'buy')
                        }
                    >
                        [Copy]
                    </button>
                    <span style={{ marginLeft: '6px' }}>
                        {item.buy.toLocaleString()}
                    </span>
                </>
            ),
        },
        {
            key: 'sell',
            header: 'sell',
            sortable: true,
            sortPath: 'sell',
            render: (item) => item.sell.toLocaleString(),
        },
        {
            key: 'roi',
            header: 'ROI',
            sortable: true,
            sortPath: 'roi',
            render: (item) => (
                <span
                    className={item.roi > 0 ? styles.positive : styles.negative}
                >
                    {item.roi}%
                </span>
            ),
        },
        {
            key: 'name',
            header: 'Name',
            sortable: true,
            sortPath: 'name',
            render: (item) => (
                <>
                    <button
                        type="button"
                        className={styles.copyBtn}
                        title="Copy item name"
                        onClick={(e) => executeCopy(e, item.name, 'name')}
                    >
                        [Copy]
                    </button>
                    <span style={{ marginLeft: '6px' }}>{item.name}</span>
                </>
            ),
        },
        {
            key: 'ipm',
            header: 'IPM',
            sortable: true,
            sortPath: 'ipm',
            render: (item) => (
                <span className={styles.positive}>
                    {item.ipm.toLocaleString()}
                </span>
            ),
        },
    ];

    const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const action = target.dataset.action;

        if (
            action === 'save-options' ||
            (target.tagName === 'INPUT' &&
                (target as HTMLInputElement).value === 'OK')
        ) {
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('refresh-info-panel'));
            }, 50);
            return;
        }

        if (action === 'get-data') {
            const tradeSettings =
                getFromStorage<ITradeSettings>('trade_settings');
            const userStats = getFromStorage<IUserStats>('user_stats');
            const userSkills = getFromStorage<IUserSkills>('user_skills');

            if (!tradeSettings) {
                console.error('No trade settings found in storage!');
                return;
            }

            startTransition(async () => {
                try {
                    const response = await fetch('/api/buy', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            tradeSettings,
                            userStats: userStats ?? {},
                            userSkills: userSkills ?? {},
                        }),
                    });

                    if (!response.ok)
                        throw new Error('Network response was not ok');
                    const result = await response.json();

                    if (result && Array.isArray(result.data)) {
                        setMarketItems(result.data);
                        setToSession<IMarketItem[]>(
                            'cached_market_items',
                            result.data,
                        );
                    } else {
                        setMarketItems([]);
                        setToSession<IMarketItem[]>('cached_market_items', []);
                    }
                } catch (error) {
                    console.error('Ошибка POST запроса:', error);
                }
            });
            return;
        }
    };

    return (
        <section onClick={handlePageClick}>
            <Overview isVisible={isOptionsVisible}>
                <OptionBarNoSSR />
                <div className="container" style={{ marginTop: '10px' }}>
                    <InfoPanelNoSSR isPending={isPending} />
                </div>
            </Overview>

            <div className={`${styles.container} container`}>
                {isPending && (
                    <div className={styles.loadingOverlay}>
                        Loading Server HTML...
                    </div>
                )}
                {!isOptionsVisible && <InfoPanelNoSSR isPending={isPending} />}

                <Table
                    items={marketItems}
                    columns={buyColumns}
                    rowKey="type_id"
                    isPending={isPending}
                    emptyMessage="📊 No data loaded. Configure settings and click 'Get Data'."
                />
            </div>
        </section>
    );
}
