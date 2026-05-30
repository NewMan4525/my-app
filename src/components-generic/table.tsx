// ./src/components-generic/table.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import styles from './css/table.module.css';

export interface ITableColumn<T> {
    key: string;
    header: string;
    sortable?: boolean;
    sortPath?: keyof T;
    render?: (item: T, index: number) => React.ReactNode;
}

interface ITableProps<T> {
    items: T[];
    columns: ITableColumn<T>[];
    rowKey: keyof T;
    isPending?: boolean;
    emptyMessage?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export default function Table<T>({
    items,
    columns,
    rowKey,
    isPending = false,
    emptyMessage = 'No data loaded.',
}: ITableProps<T>) {
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortPath, setSortPath] = useState<keyof T | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    const [selectedIds, setSelectedIds] = useState<T[keyof T][]>([]);
    const [lastClickedId, setLastClickedId] = useState<T[keyof T] | null>(null);

    // Блокируем нативное выделение текста на уровне документа при зажатом Shift
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.shiftKey) {
                document.body.style.userSelect = 'none';
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (!e.shiftKey) {
                document.body.style.userSelect = '';
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            document.body.style.userSelect = '';
        };
    }, []);

    const handleSort = (column: ITableColumn<T>) => {
        if (!column.sortable || !column.sortPath) return;

        if (sortKey === column.key) {
            if (sortDirection === 'asc') setSortDirection('desc');
            else if (sortDirection === 'desc') {
                setSortKey(null);
                setSortPath(null);
                setSortDirection(null);
            }
        } else {
            setSortKey(column.key);
            setSortPath(column.sortPath);
            setSortDirection('asc');
        }
    };

    const sortedItems = useMemo(() => {
        if (!sortPath || !sortDirection) return items;

        return [...items].sort((a, b) => {
            const aValue = a[sortPath];
            const bValue = b[sortPath];

            if (aValue === bValue) return 0;

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                if (sortDirection === 'asc') {
                    return aValue > bValue ? 1 : -1;
                }
                return aValue < bValue ? 1 : -1;
            }

            return sortDirection === 'asc'
                ? (aValue as number) - (bValue as number)
                : (bValue as number) - (aValue as number);
        });
    }, [items, sortPath, sortDirection]);

    const handleRowClick = (
        e: React.MouseEvent<HTMLTableRowElement>,
        currentItem: T,
    ) => {
        const currentId = currentItem[rowKey];

        // 1. Клик с Ctrl (Windows Style: инвертировать выбор конкретной строки, сохраняя остальные)
        if (e.ctrlKey || e.metaKey) {
            setSelectedIds((prev) =>
                prev.includes(currentId)
                    ? prev.filter((id) => id !== currentId)
                    : [...prev, currentId],
            );
            setLastClickedId(currentId);
            return;
        }

        // 2. Клик с Shift (Windows Style: выделить диапазон от опорной до текущей, СБРАСЫВАЯ старое выделение за пределами этого куска)
        if (e.shiftKey && lastClickedId !== null) {
            e.preventDefault();

            const sortedLen = sortedItems.length;
            let lastIndex = -1;
            let currentIndex = -1;

            for (let i = 0; i < sortedLen; i++) {
                if (sortedItems[i][rowKey] === lastClickedId) lastIndex = i;
                if (sortedItems[i][rowKey] === currentId) currentIndex = i;
                if (lastIndex !== -1 && currentIndex !== -1) break;
            }

            if (lastIndex !== -1 && currentIndex !== -1) {
                const start =
                    lastIndex < currentIndex ? lastIndex : currentIndex;
                const end = lastIndex > currentIndex ? lastIndex : currentIndex;

                const rangeIdsLen = end - start + 1;
                const rangeIds = new Array<T[keyof T]>(rangeIdsLen);
                let idx = 0;

                for (let i = start; i <= end; i++) {
                    rangeIds[idx++] = sortedItems[i][rowKey];
                }

                // Строго по гайдлайнам Windows: Shift сбрасывает старое выделение, заменяя его новым диапазоном
                setSelectedIds(rangeIds);
                return;
            }
        }

        // 3. Обычный клик (Windows Style: сбросить все и выделить только одну текущую строку)
        setSelectedIds([currentId]);
        setLastClickedId(currentId);
    };

    return (
        <section id="data_table" className={styles.dataTableSection}>
            <div className={styles.tableContainer}>
                <table className={styles.marketTable}>
                    <thead>
                        <tr>
                            {columns.map((col) => {
                                const isCurrentSort = sortKey === col.key;
                                return (
                                    <th
                                        key={col.key}
                                        className={
                                            col.sortable ? styles.sortable : ''
                                        }
                                        onClick={() => handleSort(col)}
                                    >
                                        {col.header}
                                        {col.sortable && (
                                            <span
                                                className={`${styles.sortIcon} ${isCurrentSort ? styles.sortActive : ''}`}
                                            >
                                                {isCurrentSort
                                                    ? sortDirection === 'asc'
                                                        ? '▲'
                                                        : '▼'
                                                    : '⥮'}
                                            </span>
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedItems.length > 0 ? (
                            sortedItems.map((item, index) => {
                                const id = item[rowKey];
                                const isSelected = selectedIds.includes(id);

                                return (
                                    <tr
                                        key={String(id)}
                                        className={`${styles.tableRow} ${isSelected ? styles.isSelected : ''}`}
                                        onClick={(e) => handleRowClick(e, item)}
                                    >
                                        {columns.map((col) => (
                                            <td key={col.key}>
                                                <div
                                                    className={
                                                        styles.cellContent
                                                    }
                                                >
                                                    {col.render
                                                        ? col.render(
                                                              item,
                                                              index,
                                                          )
                                                        : String(
                                                              item[
                                                                  col.key as keyof T
                                                              ] ?? '',
                                                          )}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className={styles.emptyCell}
                                >
                                    {isPending
                                        ? 'Loading data from server...'
                                        : emptyMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
