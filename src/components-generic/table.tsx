// src/components-generic/table.tsx
'use client';

import React, { useState, useMemo } from 'react';
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

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
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

        if (e.ctrlKey || e.metaKey) {
            setSelectedIds((prev) =>
                prev.includes(currentId)
                    ? prev.filter((id) => id !== currentId)
                    : [...prev, currentId],
            );
            setLastClickedId(currentId);
            return;
        }

        if (e.shiftKey && lastClickedId !== null) {
            const lastIndex = sortedItems.findIndex(
                (item) => item[rowKey] === lastClickedId,
            );
            const currentIndex = sortedItems.findIndex(
                (item) => item[rowKey] === currentId,
            );

            if (lastIndex !== -1 && currentIndex !== -1) {
                const start = Math.min(lastIndex, currentIndex);
                const end = Math.max(lastIndex, currentIndex);

                const rangeIds = sortedItems
                    .slice(start, end + 1)
                    .map((item) => item[rowKey]);
                setSelectedIds((prev) =>
                    Array.from(new Set([...prev, ...rangeIds])),
                );
                setLastClickedId(currentId);
                return;
            }
        }

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
                                                    : '⬍'}
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
                                        ? '🤖 Loading data from server...'
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
