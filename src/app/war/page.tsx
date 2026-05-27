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

const InfoPanelNoSSR = dynamic(
    () => import('@/src/components-feature/infoPanel'),
    { ssr: false },
);

export default function War(): React.JSX.Element {
    const [isPending, startTransition] = useTransition();
    const [warItems, setWarItems] = useState<IWarItem[]>([]);
    const [computerUser, setComputerUser] = useState<string>('User');
    const [isAutoChecking, setIsAutoChecking] = useState<boolean>(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [pathBtnText, setPathBtnText] = useState<string>('[Copy Path]');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cachedLogTextRef = useRef<string | null>(null);
    const radarWorkerRef = useRef<Worker | null>(null);
    const radarWorkerUrlRef = useRef<string | null>(null);

    // Сегрегация массивов по физическому смыслу (Buy-ордера всегда имеют buy < sell)
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

    // Модификация цен +-0.01 ISK с прямой мутацией класса анимации copyBtnCopied
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
                finalClipboardData = (
                    Math.round((parseFloat(text) + 0.01) * 100) / 100
                ).toFixed(2);
            } else if (type === 'sell') {
                finalClipboardData = (
                    Math.round((parseFloat(text) - 0.01) * 100) / 100
                ).toFixed(2);
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
        executeCopy,
    });

    const triggerRadarScan = useCallback(async (): Promise<void> => {
        const savedText = cachedLogTextRef.current;
        if (!savedText) return;
        try {
            const response = await fetch('/api/war', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logText: savedText }),
            });
            if (!response.ok) throw new Error('Network error');
            const result = await response.json();
            if (result && Array.isArray(result.data)) {
                setWarItems(result.data);
            }
        } catch (error) {
            console.error('Auto-radar scan failed:', error);
        }
    }, []);

    const toggleAutoChecker = (): void => {
        if (isAutoChecking) {
            if (radarWorkerRef.current) {
                radarWorkerRef.current.terminate();
                radarWorkerRef.current = null;
            }
            if (radarWorkerUrlRef.current) {
                URL.revokeObjectURL(radarWorkerUrlRef.current);
                radarWorkerUrlRef.current = null;
            }
            setIsAutoChecking(false);
        } else {
            if (!cachedLogTextRef.current) return;
            setIsAutoChecking(true);

            const radarCode = `let t = null; self.onmessage = function(e) { if (e.data === 'start') { t = setInterval(() => { self.postMessage('tick'); }, 305000); } };`;
            const blob = new Blob([radarCode], {
                type: 'application/javascript',
            });
            const url = URL.createObjectURL(blob);
            radarWorkerUrlRef.current = url;

            const worker = new Worker(url);
            radarWorkerRef.current = worker;
            worker.postMessage('start');
            worker.onmessage = (e: MessageEvent) => {
                if (e.data === 'tick') triggerRadarScan();
            };
        }
    };

    useEffect(() => {
        return () => {
            if (radarWorkerRef.current) radarWorkerRef.current.terminate();
            if (radarWorkerUrlRef.current)
                URL.revokeObjectURL(radarWorkerUrlRef.current);
        };
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUploadFile = (): void => {
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
                    if (!response.ok) throw new Error('Processing exception');
                    const result = await response.json();
                    if (result && Array.isArray(result.data))
                        setWarItems(result.data);

                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                } catch (error) {
                    console.error('File sync crash:', error);
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
