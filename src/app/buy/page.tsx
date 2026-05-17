// app/buy/page.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import dynamic from 'next/dynamic';
import styles from './buy.module.css';
import OptionBar from '@/src/components-feature/optionsBar';
import Overview from '@/src/components-generic/overview'; // Импортируем наш оверлей
import { getFromStorage } from '@/src/utils/storage';
import { ITradeSettings, IUserStats } from '@/src/types/interfaces';
import { IUserSkills } from '@/src/types/frontInterfaces';

const InfoPanelNoSSR = dynamic(
    () => import('@/src/components-feature/infoPanel'),
    { ssr: false },
);

export default function Buy() {
    const [isOptionsVisible, setIsOptionsVisible] = useState(true);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        const handleToggleOptions = () => setIsOptionsVisible((prev) => !prev);
        window.addEventListener('toggle-market-options', handleToggleOptions);
        return () =>
            window.removeEventListener(
                'toggle-market-options',
                handleToggleOptions,
            );
    }, []);

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
                alert('No trade settings found in storage!');
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
                    console.log('Данные получены успешно:', result);
                } catch (error) {
                    console.error('Ошибка POST запроса:', error);
                    alert('Failed to fetch data from server.');
                }
            });
            return;
        }

        if (action === 'copy') {
            const textToCopy = target.dataset.clipboardValue ?? '';
            navigator.clipboard.writeText(textToCopy);
            return;
        }
    };

    return (
        <section onClick={handlePageClick}>
            {/* 
               ПЕРЕДАЕМ СЮДА КОМПОНЕНТЫ КАК CHILDREN.
               Если isVisible={true} (display: block), infoPanel рендерится внутри оверлея под опциями.
            */}
            <Overview isVisible={isOptionsVisible}>
                <OptionBar />
                <div className="container" style={{ marginTop: '10px' }}>
                    <InfoPanelNoSSR isPending={isPending} />
                </div>
            </Overview>

            {/* ОСНОВНОЙ КОНТЕНТ СТРАНИЦЫ */}
            <div className={`${styles.container} container`}>
                {isPending && (
                    <div className={styles.loadingOverlay}>
                        Loading Server HTML...
                    </div>
                )}

                {/* 
                   ЛОГИКА ВЫКЛЮЧЕНИЯ: 
                   Если оверлей открыт (display: block), то здесь условие вернет null,
                   и инфо-панель исчезнет из основного потока страницы под Header,
                   а таблица поднимется на самый верх к шапке.
                */}
                {!isOptionsVisible && <InfoPanelNoSSR isPending={isPending} />}

                <table>{/* Таблица ордеров */}</table>
            </div>
        </section>
    );
}
