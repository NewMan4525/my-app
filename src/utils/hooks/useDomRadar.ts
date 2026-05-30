// ./src/utils/hooks/useDomRadar.ts
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { IWarItem } from '@/src/types/interfaces';

interface IDomRadarProps {
    warItems: IWarItem[]; // Исправлено: строгий интерфейс проекта вместо any
    changedAlertBtnClass: string;
}

export function useDomRadar({
    warItems,
    changedAlertBtnClass,
}: IDomRadarProps) {
    const blinkIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const hasAlertedThisTickRef = useRef<boolean>(false);

    // Запрос прав на пуши Windows при первой загрузке хука
    useEffect(() => {
        if (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'default'
        ) {
            Notification.requestPermission();
        }
    }, []);

    // Изолированная генерация нативного пуш-уведомления ОС Windows
    const triggerSystemNotification = useCallback(
        (outbidCount: number): void => {
            if (
                typeof window !== 'undefined' &&
                'Notification' in window &&
                Notification.permission === 'granted' &&
                document.hidden
            ) {
                const notification = new Notification(
                    '⚔️ ISK MASTER: Ордера перебиты!',
                    {
                        body: `Внимание! Обнаружено ${outbidCount} вражеских ставок. Пора переставлять цены!`,
                        tag: 'eve-war-alert',
                        requireInteraction: false,
                    },
                );

                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };
            }
        },
        [],
    );
    const updateBlinkingAlertStatus = useCallback((): void => {
        const rows = document.querySelectorAll('tr');
        const len = rows.length;
        let hasActiveOutbid = false;
        let outbidCounter = 0;

        for (let i = 0; i < len; i++) {
            const tr = rows[i] as HTMLTableRowElement;
            if (
                tr.hasAttribute('data-row-done') ||
                tr.hasAttribute('data-status-ignored')
            )
                continue;

            const alertBtn = tr.querySelector(
                `.${changedAlertBtnClass}`,
            ) as HTMLButtonElement | null;
            if (alertBtn && alertBtn.innerText === 'OUTBID') {
                hasActiveOutbid = true;
                outbidCounter++;
            }
        }

        if (hasActiveOutbid) {
            if (!blinkIntervalRef.current) {
                let toggle = false;
                blinkIntervalRef.current = setInterval(() => {
                    document.title = toggle ? '🔴 0.01 ISK WAR' : 'ISK Master';
                    toggle = !toggle;
                }, 1000);
            }
            if (document.hidden && !hasAlertedThisTickRef.current) {
                hasAlertedThisTickRef.current = true;
                triggerSystemNotification(outbidCounter);
            }
        } else {
            if (blinkIntervalRef.current) {
                clearInterval(blinkIntervalRef.current);
                blinkIntervalRef.current = null;
            }
            document.title = 'ISK Master';
            hasAlertedThisTickRef.current = false;
        }
    }, [triggerSystemNotification, changedAlertBtnClass]);

    useEffect(() => {
        hasAlertedThisTickRef.current = false;
        updateBlinkingAlertStatus();

        window.addEventListener('war-dom-updated', updateBlinkingAlertStatus);
        return () => {
            window.removeEventListener(
                'war-dom-updated',
                updateBlinkingAlertStatus,
            );
            if (blinkIntervalRef.current)
                clearInterval(blinkIntervalRef.current);
            document.title = 'ISK Master';
        };
    }, [warItems, updateBlinkingAlertStatus]);
}
