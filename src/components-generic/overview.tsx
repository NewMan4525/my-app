// ./src/components-generic/overview.tsx
'use client';

import React from 'react';
import styles from './css/overview.module.css';

interface OverviewProps {
    children: React.ReactNode;
    isVisible: boolean;
}

export default function Overview({ children, isVisible }: OverviewProps) {
    return (
        <div
            className={styles.overview}
            style={{ display: isVisible ? 'block' : 'none' }}
        >
            {children}
        </div>
    );
}
