// ./src/app/war/columnsConfig.tsx

import React from 'react';
import { ITableColumn } from '@/src/components-generic/table';
import { IWarItem } from '@/src/types/interfaces';
import styles from './war.module.css';

const handleCheckboxDomChange = (
    e: React.ChangeEvent<HTMLInputElement>,
): void => {
    const row = e.target.closest('tr');
    if (!row) return;
    row.style.opacity = e.target.checked ? '0.35' : '1';
    row.style.transition = 'opacity 0.1s ease';
};

const handleStatusDomToggle = (
    e: React.MouseEvent<HTMLButtonElement>,
): void => {
    e.stopPropagation();
    const button = e.currentTarget as HTMLButtonElement;

    if (button.innerText === 'OUTBID') {
        button.innerText = 'IGNORED';
        button.className = styles.ignoredBadge;
    } else if (button.innerText === 'IGNORED') {
        button.innerText = 'OUTBID';
        button.className = styles.changedAlertBtn;
    }
};

interface IConfigProps {
    executeCopy: (
        e: React.MouseEvent<HTMLButtonElement>,
        text: string,
        type: 'buy' | 'sell' | 'name',
    ) => void;
}

export const useWarColumnsConfiguration = ({ executeCopy }: IConfigProps) => {
    const renderStatusCell = (item: IWarItem) => {
        return (
            <div className={styles.statusControlGroup}>
                <input
                    type="checkbox"
                    onChange={handleCheckboxDomChange}
                    className={styles.warCheckbox}
                />
                {/* Всегда рендерим кнопку. Если item.status равен "", псевдокласс :empty в CSS уберет рамку и фон */}
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
