// ./src/app/war/columnsConfig.tsx

import React from 'react';
import { ITableColumn } from '@/src/components-generic/table';
import { IWarItem } from '@/src/types/interfaces';
import styles from './war.module.css';

const dispatchDomUpdateEvent = (): void => {
    window.dispatchEvent(new CustomEvent('war-dom-updated'));
};

const handleCheckboxDomChange = (
    e: React.ChangeEvent<HTMLInputElement>,
): void => {
    const row = e.target.closest('tr');
    if (!row) return;

    if (e.target.checked) {
        row.style.opacity = '0.35';
        row.setAttribute('data-row-done', 'true');
    } else {
        row.style.opacity = '1';
        row.removeAttribute('data-row-done');
    }
    row.style.transition = 'opacity 0.1s ease';

    dispatchDomUpdateEvent();
};

const handleStatusDomToggle = (
    e: React.MouseEvent<HTMLButtonElement>,
): void => {
    e.stopPropagation();
    const button = e.currentTarget as HTMLButtonElement;
    const row = button.closest('tr');

    if (button.innerText === 'OUTBID') {
        button.innerText = 'IGNORED';
        button.className = styles.ignoredBadge;
        if (row) row.setAttribute('data-status-ignored', 'true');
    } else if (button.innerText === 'IGNORED') {
        button.innerText = 'OUTBID';
        button.className = styles.changedAlertBtn;
        if (row) row.removeAttribute('data-status-ignored');
    }

    dispatchDomUpdateEvent();
};

interface IConfigProps {
    updateNonce: string; // <-- Уникальный маркер обновления данных
    executeCopy: (
        e: React.MouseEvent<HTMLButtonElement>,
        text: string,
        type: 'buy' | 'sell' | 'name',
    ) => void;
}

export const useWarColumnsConfiguration = ({
    updateNonce,
    executeCopy,
}: IConfigProps) => {
    const renderStatusCell = (item: IWarItem) => {
        return (
            <div className={styles.statusControlGroup}>
                {/* 
                  updateNonce гарантирует смену ключа при КАЖДОМ ответе сервера, 
                  что аппаратно уничтожает старый чекбокс и монтирует новый со значением false.
                */}
                <input
                    key={`${updateNonce}-${item.orderID}`}
                    type="checkbox"
                    onChange={handleCheckboxDomChange}
                    className={styles.warCheckbox}
                />
                <button
                    type="button"
                    onClick={handleStatusDomToggle}
                    className={
                        item.status === 'IGNORED'
                            ? styles.ignoredBadge
                            : styles.changedAlertBtn
                    }
                >
                    {item.status}
                </button>
            </div>
        );
    };

    const sellColumns: ITableColumn<IWarItem>[] = [
        {
            key: 'changed',
            header: 'changed',
            sortable: true,
            sortPath: 'status',
            render: renderStatusCell,
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
            render: (item) => (
                <div className={styles.priceCellContainer}>
                    <button
                        type="button"
                        className={styles.copyBtn}
                        onClick={(e) => executeCopy(e, item.name, 'name')}
                    >
                        [Copy]
                    </button>
                    <span className={styles.itemName}>{item.name}</span>
                </div>
            ),
        },
    ];

    const buyColumns: ITableColumn<IWarItem>[] = [
        {
            key: 'changed',
            header: 'changed',
            sortable: true,
            sortPath: 'status',
            render: renderStatusCell,
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
            render: (item) => (
                <div className={styles.priceCellContainer}>
                    <button
                        type="button"
                        className={styles.copyBtn}
                        onClick={(e) => executeCopy(e, item.name, 'name')}
                    >
                        [Copy]
                    </button>
                    <span className={styles.itemName}>{item.name}</span>
                </div>
            ),
        },
    ];

    return { sellColumns, buyColumns };
};
