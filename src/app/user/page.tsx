// ./src/app/user/page.tsx
'use client';

import dynamic from 'next/dynamic';
import styles from './user.module.css';

const UserFormNoSSR = dynamic(
    () => import('@/src/components-feature/userForm'),
    {
        ssr: false,
        loading: () => (
            <div className="container">🤖 Loading User Interface...</div>
        ),
    },
);

export default function User() {
    return (
        <section className={styles.pageWrapper}>
            <UserFormNoSSR />
        </section>
    );
}
