// ./src/app/war/page.tsx
'use client';

import React, {
    useState,
    useTransition,
    useRef,
    useMemo,
    useCallback,
} from 'react';
import dynamic from 'next/dynamic';
import styles from './war.module.css';
import Table from '@/src/components-generic/table';
import { IWarItem } from '@/src/types/interfaces';
import { useWarColumnsConfiguration } from './columnsConfig';
import {
    calculateModifiedIsk,
    copyToClipboardWithFeedback,
} from '@/src/utils/helpers';
import { useDomRadar } from '@/src/utils/hooks/useDomRadar';
import { useChromiumWorker } from '@/src/utils/hooks/useChromiumWorker';

const InfoPanelNoSSR = dynamic(
    () => import('@/src/components-feature/infoPanel'),
    { ssr: false },
);

export default function War() {
    const [isPending, startTransition] = useTransition();
    const [warItems, setWarItems] = useState<IWarItem[]>([]);
    const [computerUser, setComputerUser] = useState<string>('User');
    const [selectedFile, setSelectedFile] = useState<FileList | null>(null);
    const [pathBtnText, setPathBtnText] = useState<string>('[Copy Path]');
    const [updateNonce, setUpdateNonce] = useState<string>('init');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cachedLogTextRef = useRef<string | null>(null);

    // Оптимизированное линейное распределение ордеров SELL / BUY
    const { sellWarItems, buyWarItems } = useMemo(() => {
        const len = warItems.length;
        const sellItems: IWarItem[] = [];
        const buyItems: IWarItem[] = [];

        for (let i = 0; i < len; i++) {
            const item = warItems[i];
            if (item.isBuy) {
                buyItems.push(item);
            } else {
                sellItems.push(item);
            }
        }

        return { sellWarItems: sellItems, buyWarItems: buyItems };
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
        const len = rows.length;
        for (let i = 0; i < len; i++) {
            const tr = rows[i] as HTMLTableRowElement;
            tr.removeAttribute('data-row-done');
            tr.removeAttribute('data-status-ignored');
            if (tr.style.opacity === '0.35') {
                tr.style.opacity = '1';
            }
        }
    };
    const executeCopy = useCallback(
        (
            e: React.MouseEvent<HTMLButtonElement>,
            text: string,
            type: 'buy' | 'sell' | 'name',
        ): void => {
            e.stopPropagation();
            let finalClipboardData = text;

            if (type === 'buy') {
                finalClipboardData = calculateModifiedIsk(Number(text), 'plus');
            } else if (type === 'sell') {
                finalClipboardData = calculateModifiedIsk(
                    Number(text),
                    'minus',
                );
            }

            copyToClipboardWithFeedback(
                e.currentTarget,
                finalClipboardData,
                styles.copyBtnCopied,
            );
        },
        [],
    );

    // 1. ПОДКЛЮЧЕНИЕ ИЗОЛИРОВАННЫХ ХУКОВ-РАДАРОВ ИЗ UTILS/HOOKS
    useDomRadar({ warItems, changedAlertBtnClass: styles.changedAlertBtn });

    const { isAutoChecking, toggleAutoChecker } = useChromiumWorker({
        cachedLogTextRef,
        setWarItems,
        clearRowsVisualOpacity,
        setUpdateNonce,
    });

    const { sellColumns, buyColumns } = useWarColumnsConfiguration({
        updateNonce,
        executeCopy,
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        if (e.target.files && e.target.files.length > 0)
            setSelectedFile(e.target.files);
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
                    if (result && Array.isArray(result.data))
                        setWarItems(result.data);

                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                } catch (error) {
                    console.error('File sync crash:', error);
                }
            });
        };
        reader.readAsText(selectedFile[0]);
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
