// ./src/app/war/page.tsx
'use client';

import React, {
    useState,
    useTransition,
    useRef,
    useMemo,
    useEffect,
    useCallback,
} from 'react';
import dynamic from 'next/dynamic';
import styles from './war.module.css';
import Table from '@/src/components-generic/table';
import { IWarItem } from '@/src/types/interfaces';
import { useWarColumnsConfiguration } from './columnsConfig';
import { calculateModifiedIsk } from '@/src/utils/clipboardModify';

const InfoPanelNoSSR = dynamic(
    () => import('@/src/components-feature/infoPanel'),
    { ssr: false },
);

export default function War(): React.JSX.Element {
    const [isPending, startTransition] = useTransition();
    const [warItems, setWarItems] = useState<IWarItem[]>([]);
    const [computerUser, setComputerUser] = useState<string>('User');
    const [isAutoChecking, setIsAutoChecking] = useState<boolean>(false);
    const [selectedFile, setSelectedFile] = useState<FileList | null>(null);
    const [pathBtnText, setPathBtnText] = useState<string>('[Copy Path]');
    const [updateNonce, setUpdateNonce] = useState<string>('init');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cachedLogTextRef = useRef<string | null>(null);
    const radarWorkerRef = useRef<Worker | null>(null);
    const blinkIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const sellWarItems = useMemo(() => {
        return warItems.filter((item) => !item.isBuy);
    }, [warItems]);

    const buyWarItems = useMemo(() => {
        return warItems.filter((item) => item.isBuy);
    }, [warItems]);

    const computedLogPath = useMemo(() => {
        const user = computerUser.trim() || 'User';
        return `C:\\Users\\${user}\\Documents\\EVE\\logs\\Marketlogs`;
    }, [computerUser]);

    const handleCopyPath = (): void => {
        navigator.clipboard.writeText(computedLogPath).then(() => {
            setPathBtnText('[Copied!]');
            setTimeout(() => setPathBtnText('[Copy Path]'), 1500);
        });
    };

    const clearRowsVisualOpacity = (): void => {
        const rows = document.querySelectorAll('tr');
        rows.forEach((row) => {
            const tr = row as HTMLTableRowElement;
            tr.removeAttribute('data-row-done');
            tr.removeAttribute('data-status-ignored');
            if (tr.style.opacity === '0.35') {
                tr.style.opacity = '1';
            }
        });
    };

    // Запрос прав на системные уведомления Windows при инициализации модуля
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    }, []);

    // Реф-предохранитель, защищающий от циклического спама модальными окнами

    // Реф-предохранитель, чтобы не спамить звуковыми сигналами на одном тике

    const hasAlertedThisTickRef = useRef<boolean>(false);

    // Функция генерации системного пуша. Именно пуш заставляет мигать панель задач в Windows.
    const triggerSystemNotification = useCallback(
        (outbidCount: number): void => {
            if (
                typeof window !== 'undefined' &&
                'Notification' in window &&
                Notification.permission === 'granted' &&
                document.hidden // Стреляет строго тогда, когда браузер свернут и вы в игре
            ) {
                // Создаем нативный пуш Windows
                const notification = new Notification(
                    '⚔️ ISK MASTER: Ордера перебиты!',
                    {
                        body: `Внимание! Обнаружено ${outbidCount} вражеских ставок. Пора переставлять цены!`,
                        tag: 'eve-war-alert', // Предотвращает спам (новый пуш заменяет старый)
                        requireInteraction: false, // Пуш пропадет сам, но иконка на панели задач продолжит мигать
                    },
                );

                // При клике на пуш — разворачиваем и фокусируем окно браузера
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
        let hasActiveOutbid = false;
        let outbidCounter = 0;

        for (let i = 0; i < rows.length; i++) {
            const tr = rows[i] as HTMLTableRowElement;

            if (
                tr.hasAttribute('data-row-done') ||
                tr.hasAttribute('data-status-ignored')
            ) {
                continue;
            }

            const alertBtn = tr.querySelector(
                `.${styles.changedAlertBtn}`,
            ) as HTMLButtonElement | null;
            if (alertBtn && alertBtn.innerText === 'OUTBID') {
                hasActiveOutbid = true;
                outbidCounter++;
            }
        }

        if (hasActiveOutbid) {
            // 1. Внутреннее мигание названия вкладки
            if (!blinkIntervalRef.current) {
                let toggle = false;
                blinkIntervalRef.current = setInterval(() => {
                    document.title = toggle ? '🔴 0.01 ISK WAR' : 'ISK Master';
                    toggle = !toggle;
                }, 1000);
            }

            // 2. Внешний триггер Windows через системный пуш
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
    }, [triggerSystemNotification]);

    // Запрос прав на пуши при первой загрузке интерфейса
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    }, []);

    // Сброс предохранителя спама при получении свежих данных от авто-чекера
    useEffect(() => {
        hasAlertedThisTickRef.current = false;
        updateBlinkingAlertStatus();

        window.addEventListener('war-dom-updated', updateBlinkingAlertStatus);
        return () => {
            window.removeEventListener(
                'war-dom-updated',
                updateBlinkingAlertStatus,
            );
        };
    }, [warItems, updateBlinkingAlertStatus]);
    const executeCopy = useCallback(
        (
            e: React.MouseEvent<HTMLButtonElement>,
            text: string,
            type: 'buy' | 'sell' | 'name',
        ): void => {
            e.stopPropagation();
            const button = e.currentTarget as HTMLButtonElement;
            let finalClipboardData = text;

            if (type === 'buy') {
                finalClipboardData = calculateModifiedIsk(Number(text), 'plus');
            } else if (type === 'sell') {
                finalClipboardData = calculateModifiedIsk(
                    Number(text),
                    'minus',
                );
            }

            navigator.clipboard
                .writeText(finalClipboardData)
                .then(() => {
                    const originalText = button.textContent;
                    button.textContent = '[Copied]';
                    button.classList.add(styles.copyBtnCopied);

                    setTimeout(() => {
                        button.textContent = originalText;
                        button.classList.remove(styles.copyBtnCopied);
                    }, 1000);
                })
                .catch((err) => console.error('Copy process rejected:', err));
        },
        [],
    );

    const { sellColumns, buyColumns } = useWarColumnsConfiguration({
        updateNonce,
        executeCopy,
    });

    const toggleAutoChecker = (): void => {
        if (isAutoChecking) {
            if (radarWorkerRef.current) {
                radarWorkerRef.current.terminate();
                radarWorkerRef.current = null;
            }
            setIsAutoChecking(false);
        } else {
            const savedText = cachedLogTextRef.current;
            if (!savedText) return;
            setIsAutoChecking(true);

            const radarCode = `
                self.onmessage = function(e) {
                    if (e.data === 'start') {
                        setInterval(() => {
                            self.postMessage('tick');
                        }, 305000);
                    }
                };
            `;

            const blob = new Blob([radarCode], {
                type: 'application/javascript',
            });
            const url = URL.createObjectURL(blob);
            const worker = new Worker(url);
            radarWorkerRef.current = worker;

            worker.postMessage('start');

            worker.onmessage = async (e: MessageEvent) => {
                if (e.data === 'tick' && cachedLogTextRef.current) {
                    try {
                        const response = await fetch('/api/war', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                logText: cachedLogTextRef.current,
                            }),
                        });

                        if (response.ok) {
                            const result = await response.json();

                            clearRowsVisualOpacity();
                            setUpdateNonce(Date.now().toString());
                            if (result && Array.isArray(result.data)) {
                                setWarItems(result.data);
                            }
                        }
                    } catch (err) {
                        console.error(
                            'Background auto radar network crash:',
                            err,
                        );
                    }
                }
            };
            URL.revokeObjectURL(url);
        }
    };

    useEffect(() => {
        return () => {
            if (radarWorkerRef.current) radarWorkerRef.current.terminate();
            if (blinkIntervalRef.current)
                clearInterval(blinkIntervalRef.current);
        };
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files);
        }
    };

    const handleUploadFile = (): void => {
        if (!selectedFile || selectedFile.length === 0) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            const textContent = event.target?.result as string;
            if (!textContent) return;
            cachedLogTextRef.current = textContent;

            startTransition(async () => {
                try {
                    const response = await fetch('/api/war', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ logText: textContent }),
                    });
                    if (!response.ok) throw new Error('Processing exception');
                    const result = await response.json();

                    clearRowsVisualOpacity();
                    setUpdateNonce(Date.now().toString());
                    if (result && Array.isArray(result.data)) {
                        setWarItems(result.data);
                    }

                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                } catch (error) {
                    console.error('File sync crash:', error);
                }
            });
        };
        reader.readAsText(selectedFile[0]);
    };

    // ./src/app/war/page.tsx (Полный блок разметки return)

    return (
        <section className={styles.warPageSection}>
            <div className="container">
                <InfoPanelNoSSR isPending={isPending} />
            </div>

            <div className="container" style={{ marginTop: '20px' }}>
                <div className={styles.uploadCard}>
                    <h3>⚔️ 0.01 ISK War Analyzer</h3>

                    <div className={styles.pathBuilderRow}>
                        <span className={styles.pathText}>C:\Users\</span>
                        <input
                            type="text"
                            value={computerUser}
                            placeholder="Computer user"
                            onChange={(e) => setComputerUser(e.target.value)}
                            className={styles.inlineUserInput}
                            disabled={isPending}
                        />
                        <span className={styles.pathText}>
                            \Documents\EVE\logs\Marketlogs
                        </span>
                        <button
                            type="button"
                            className={styles.inlineCopyBtn}
                            onClick={handleCopyPath}
                        >
                            {pathBtnText}
                        </button>
                    </div>

                    <div
                        className={styles.actionRow}
                        style={{ marginTop: '16px' }}
                    >
                        <input
                            type="file"
                            accept=".txt,.csv"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            className={styles.fileInput}
                            disabled={isPending}
                        />
                        <button
                            type="button"
                            onClick={handleUploadFile}
                            disabled={!selectedFile || isPending}
                            className={styles.uploadBtn}
                        >
                            {isPending ? 'Processing...' : 'Analyze Market Log'}
                        </button>
                        <button
                            type="button"
                            onClick={toggleAutoChecker}
                            className={`${styles.radarBtn} ${isAutoChecking ? styles.radarActive : ''}`}
                            title="Automatically re-scan market every 5 minutes"
                        >
                            {isAutoChecking
                                ? '📡 Auto-Radar: ON'
                                : '🛰️ Start Auto-Radar (5m)'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="container" style={{ marginTop: '24px' }}>
                <h4 className={styles.tableHeading}>🔻 SELL ORDERS</h4>
                <Table<IWarItem>
                    items={sellWarItems}
                    columns={sellColumns}
                    rowKey="orderID"
                    isPending={isPending}
                    emptyMessage="No sell orders found in file."
                />
            </div>

            <div className="container" style={{ marginTop: '32px' }}>
                <h4 className={styles.tableHeading}>🔺 BUY ORDERS</h4>
                <Table<IWarItem>
                    items={buyWarItems}
                    columns={buyColumns}
                    rowKey="orderID"
                    isPending={isPending}
                    emptyMessage="No buy orders found in file."
                />
            </div>
        </section>
    );
}
