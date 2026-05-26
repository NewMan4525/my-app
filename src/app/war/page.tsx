// ./src/app/war/page.tsx
'use client';

import {
    useState,
    useTransition,
    useRef,
    useMemo,
    useEffect,
    useCallback,
} from 'react';
import dynamic from 'next/dynamic';
import styles from './war.module.css';
import Table, { ITableColumn } from '@/src/components-generic/table';
import { calculateModifiedIsk } from '@/src/utils/clipboardModify';

interface IWarItem {
    name: string;
    vol: number;
    buy: number;
    sell: number;
    roi: number;
    ipm: number;
    orderID: string;
}

const InfoPanelNoSSR = dynamic(
    () => import('@/src/components-feature/infoPanel'),
    { ssr: false },
);

export default function War() {
    const [isPending, startTransition] = useTransition();
    const [warItems, setWarItems] = useState<IWarItem[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [pathBtnText, setPathBtnText] = useState('[Copy Path]');
    const [computerUser, setComputerUser] = useState('User');

    const [isAutoChecking, setIsAutoChecking] = useState(false);
    const [ignoredOrderNames, setIgnoredOrderNames] = useState<string[]>([]);
    const [checkedOrderIds, setCheckedOrderIds] = useState<string[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cachedLogTextRef = useRef<string | null>(null);

    // Рефы для хранения неубиваемых фоновых потоков Web Worker
    const radarWorkerRef = useRef<Worker | null>(null);
    const blinkWorkerRef = useRef<Worker | null>(null);
    const blinkToggleRef = useRef<boolean>(false);

    // НЕУБИВАЕМЫЙ В ФОНЕ МИГАЮЩИЙ ТАЙМЕР (МЕХАНИКА AVITO / MAIL.RU)
    const manageBlinkingAlert = useCallback((shouldBlink: boolean) => {
        if (typeof window === 'undefined') return;

        if (!shouldBlink) {
            if (blinkWorkerRef.current) {
                blinkWorkerRef.current.terminate(); // Убиваем поток воркера
                blinkWorkerRef.current = null;
            }
            document.title = `0.01 ISK WAR | ISK Master`;
            return;
        }

        if (blinkWorkerRef.current) return; // Воркер уже пашет в фоне

        // Пишем код таймера внутри строки для изоляции в системном потоке ОС
        const workerCode = `
            let timer = null;
            self.onmessage = function(e) {
                if (e.data === 'start') {
                    timer = setInterval(() => {
                        self.postMessage('blink_tick');
                    }, 1000);
                } else if (e.data === 'stop') {
                    clearInterval(timer);
                }
            };
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);

        // Запуск системного воркера
        blinkWorkerRef.current = new Worker(workerUrl);
        blinkWorkerRef.current.postMessage('start');

        // Слушаем «пинки» от воркера из фонового потока ОС
        blinkWorkerRef.current.onmessage = (e) => {
            if (e.data === 'blink_tick') {
                blinkToggleRef.current = !blinkToggleRef.current;
                if (blinkToggleRef.current) {
                    document.title = `🔴 0.01 ISK WAR`;
                } else {
                    document.title = `0.01 ISK WAR | ISK Master`;
                }
            }
        };
    }, []);

    const toggleIgnoreOrder = (orderName: string) => {
        setIgnoredOrderNames((prev) =>
            prev.includes(orderName)
                ? prev.filter((name) => name !== orderName)
                : [...prev, orderName],
        );
    };

    const toggleCheckOrder = (orderId: string) => {
        setCheckedOrderIds((prev) =>
            prev.includes(orderId)
                ? prev.filter((id) => id !== orderId)
                : [...prev, orderId],
        );
    };

    useEffect(() => {
        const hasActiveThreat = warItems.some((item) => {
            const nameUpper = item.name.toUpperCase();
            const isUndercut = nameUpper.includes('UNDER_CUT');
            const isNotIgnored = !ignoredOrderNames.includes(item.name);
            const isNotChecked = !checkedOrderIds.includes(item.orderID);
            return isUndercut && isNotIgnored && isNotChecked;
        });

        manageBlinkingAlert(hasActiveThreat);
    }, [warItems, ignoredOrderNames, checkedOrderIds, manageBlinkingAlert]);

    const executeCopy = (
        e: React.MouseEvent<HTMLButtonElement>,
        text: string,
        type: 'buy' | 'sell' | 'name',
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

    // КОНФИГУРАЦИЯ ДЛЯ ТАБЛИЦЫ SELL (Колонки: changed, sell, Item Name)
    const sellColumns: ITableColumn<IWarItem>[] = [
        {
            key: 'changed',
            header: 'changed',
            sortable: true,
            sortPath: 'name',
            render: (item) => {
                const isUndercut = item.name.includes('[SELL UNDER_CUT]');
                if (!isUndercut) return null;

                const isChecked = checkedOrderIds.includes(item.orderID);
                const isIgnored = ignoredOrderNames.includes(item.name);

                return (
                    <div className={styles.statusControlGroup}>
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCheckOrder(item.orderID)}
                            className={styles.warCheckbox}
                        />
                        <button
                            type="button"
                            onClick={() => toggleIgnoreOrder(item.name)}
                            disabled={isChecked}
                            className={
                                isChecked
                                    ? styles.checkedMutedBadge
                                    : isIgnored
                                      ? styles.ignoredBadge
                                      : styles.changedAlertBtn
                            }
                        >
                            {isChecked
                                ? 'DONE'
                                : isIgnored
                                  ? 'IGNORED'
                                  : 'CHANGED'}
                        </button>
                    </div>
                );
            },
        },
        {
            key: 'sell',
            header: 'sell',
            sortable: true,
            sortPath: 'sell',
            render: (item) => (
                <div className={styles.priceCellContainer}>
                    <button
                        type="button"
                        className={styles.copyBtn}
                        title="Copy modified sell price (-1 step)"
                        onClick={(e) =>
                            executeCopy(e, item.sell.toString(), 'sell')
                        }
                    >
                        [Copy]
                    </button>
                    <span className={styles.priceValue}>
                        {item.sell.toLocaleString()}
                    </span>
                </div>
            ),
        },
        {
            key: 'name',
            header: 'Item Name',
            sortable: true,
            sortPath: 'name',
            render: (item) => {
                const cleanName = item.name
                    .replace('⚔️ [SELL UNDER_CUT] ', '')
                    .replace('👑 [SELL TOP_1] ', '');
                return (
                    <div className={styles.priceCellContainer}>
                        <button
                            type="button"
                            className={styles.copyBtn}
                            title="Copy item name for in-game market search"
                            onClick={(e) => executeCopy(e, cleanName, 'name')}
                        >
                            [Copy]
                        </button>
                        <span
                            className={styles.itemName}
                            style={{ marginLeft: '6px' }}
                        >
                            {cleanName}
                        </span>
                    </div>
                );
            },
        },
    ];

    // КОНФИГУРАЦИЯ ДЛЯ ТАБЛИЦЫ BUY (Колонки: changed, buy, Item Name)
    const buyColumns: ITableColumn<IWarItem>[] = [
        {
            key: 'changed',
            header: 'changed',
            sortable: true,
            sortPath: 'name',
            render: (item) => {
                const isUndercut = item.name.includes('[BUY UNDER_CUT]');
                if (!isUndercut) return null;

                const isChecked = checkedOrderIds.includes(item.orderID);
                const isIgnored = ignoredOrderNames.includes(item.name);

                return (
                    <div className={styles.statusControlGroup}>
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCheckOrder(item.orderID)}
                            className={styles.warCheckbox}
                        />
                        <button
                            type="button"
                            onClick={() => toggleIgnoreOrder(item.name)}
                            disabled={isChecked}
                            className={
                                isChecked
                                    ? styles.checkedMutedBadge
                                    : isIgnored
                                      ? styles.ignoredBadge
                                      : styles.changedAlertBtn
                            }
                        >
                            {isChecked
                                ? 'DONE'
                                : isIgnored
                                  ? 'IGNORED'
                                  : 'CHANGED'}
                        </button>
                    </div>
                );
            },
        },
        {
            key: 'buy',
            header: 'buy',
            sortable: true,
            sortPath: 'buy',
            render: (item) => (
                <div className={styles.priceCellContainer}>
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
                    <span className={styles.priceValue}>
                        {item.buy.toLocaleString()}
                    </span>
                </div>
            ),
        },
        {
            key: 'name',
            header: 'Item Name',
            sortable: true,
            sortPath: 'name',
            render: (item) => {
                const cleanName = item.name
                    .replace('⚔️ [BUY UNDER_CUT] ', '')
                    .replace('👑 [BUY TOP_1] ', '');
                return (
                    <div className={styles.priceCellContainer}>
                        <button
                            type="button"
                            className={styles.copyBtn}
                            title="Copy item name for in-game market search"
                            onClick={(e) => executeCopy(e, cleanName, 'name')}
                        >
                            [Copy]
                        </button>
                        <span
                            className={styles.itemName}
                            style={{ marginLeft: '6px' }}
                        >
                            {cleanName}
                        </span>
                    </div>
                );
            },
        },
    ];

    const sellWarItems = useMemo(() => {
        return warItems.filter(
            (item) =>
                item.name.includes('[SELL UNDER_CUT]') ||
                item.name.includes('[SELL TOP_1]'),
        );
    }, [warItems]);

    const buyWarItems = useMemo(() => {
        return warItems.filter(
            (item) =>
                item.name.includes('[BUY UNDER_CUT]') ||
                item.name.includes('[BUY TOP_1]'),
        );
    }, [warItems]);
    const triggerRadarScan = async () => {
        const savedText = cachedLogTextRef.current;
        if (!savedText) return;

        try {
            const response = await fetch('/api/war', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logText: savedText }),
            });
            if (!response.ok) throw new Error('Radar scan failed');
            const result = await response.json();
            if (result && Array.isArray(result.data)) {
                setCheckedOrderIds([]);
                setWarItems(result.data);
            }
        } catch (error) {
            console.error('Error during auto-radar scan:', error);
        }
    };

    // НЕУБИВАЕМЫЙ УПРАВЛЯЮЩИЙ ЦИКЛ АВТО-РАДАРА В ВОРКЕРЕ
    const toggleAutoChecker = () => {
        if (isAutoChecking) {
            if (radarWorkerRef.current) {
                radarWorkerRef.current.terminate();
                radarWorkerRef.current = null;
            }
            setIsAutoChecking(false);
            manageBlinkingAlert(false);
        } else {
            if (!cachedLogTextRef.current) {
                console.error(
                    'No market log cache available. Upload a file first.',
                );
                return;
            }
            setIsAutoChecking(true);

            // Изолированный 5-минутный таймер в системном потоке ОС
            const radarCode = `
                let timer = null;
                self.onmessage = function(e) {
                    if (e.data === 'start') {
                        // 5 минут и 5 секунд буфера кэша ESI API
                        timer = setInterval(() => {
                            self.postMessage('scan_tick');
                        }, 5 * 60 * 1000 + 5000);
                    }
                };
            `;

            const blob = new Blob([radarCode], {
                type: 'application/javascript',
            });
            const workerUrl = URL.createObjectURL(blob);

            radarWorkerRef.current = new Worker(workerUrl);
            radarWorkerRef.current.postMessage('start');

            // Ловим тик из фонового потока и принудительно пинаем React на отправку fetch запроса
            radarWorkerRef.current.onmessage = (e) => {
                if (e.data === 'scan_tick') {
                    startTransition(() => {
                        triggerRadarScan();
                    });
                }
            };
        }
    };

    // Очищаем системные воркеры при уничтожении страницы, чтобы не забивать память ПК
    useEffect(() => {
        return () => {
            // ИСПРАВЛЕНИЕ: Удален вызов несуществующего checkIntervalRef
            if (radarWorkerRef.current) radarWorkerRef.current.terminate();
            if (blinkWorkerRef.current) blinkWorkerRef.current.terminate();
        };
    }, []);

    const handleCopyPath = () => {
        const currentUser = computerUser.trim() || 'User';
        const fullPath = `C:\\Users\\${currentUser}\\Documents\\EVE\\logs\\Marketlogs`;
        navigator.clipboard.writeText(fullPath).then(() => {
            setPathBtnText('[Copied!]');
            setTimeout(() => setPathBtnText('[Copy Path]'), 1500);
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // ИСПРАВЛЕНИЕ: Вытаскиваем строго первый файл [0] вместо всего массива FileList
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUploadFile = () => {
        if (!selectedFile) return;

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

                    if (!response.ok) throw new Error('Ошибка обработки файла');
                    const result = await response.json();

                    if (result && Array.isArray(result.data)) {
                        // ИСПРАВЛЕНО: Вызываем верное имя метода обновления стейта при новой ручной загрузке
                        setCheckedOrderIds([]);
                        setWarItems(result.data);
                    } else {
                        setWarItems([]);
                    }

                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                } catch (error) {
                    console.error('Ошибка отправки логов:', error);
                    setWarItems([]);
                }
            });
        };

        reader.readAsText(selectedFile);
    };

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
                <h4 className={styles.tableHeading}>
                    🔻 SELL ORDERS (All Positions)
                </h4>
                <Table<IWarItem>
                    items={sellWarItems}
                    columns={sellColumns}
                    rowKey="name"
                    isPending={isPending}
                    emptyMessage="No sell orders found in file."
                />
            </div>

            <div className="container" style={{ marginTop: '32px' }}>
                <h4 className={styles.tableHeading}>
                    🔺 BUY ORDERS (All Positions)
                </h4>
                <Table<IWarItem>
                    items={buyWarItems}
                    columns={buyColumns}
                    rowKey="name"
                    isPending={isPending}
                    emptyMessage="No buy orders found in file."
                />
            </div>
        </section>
    );
}
