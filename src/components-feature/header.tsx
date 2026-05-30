// ./src/components-feature/header.tsx
'use client';

import { usePathname } from 'next/navigation';
import styles from './css/header.module.css';
import Link from '@/src/components-generic/link';
import Button from '@/src/components-generic/button';

export default function Header() {
    const pathname = usePathname();

    const links = [
        { href: 'user', text: 'User' },
        { href: 'buy', text: 'Buy' },
        { href: 'sell', text: 'Sell' },
        { href: 'war', text: '0.01 isk war' },
    ];

    const handleHeaderClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;

        // Оптимизировано под MPA: Ограничиваем отправку события только на целевом роуте /buy
        if (
            pathname === '/buy' &&
            target.tagName === 'BUTTON' &&
            target.getAttribute('value') === '#'
        ) {
            window.dispatchEvent(new CustomEvent('toggle-market-options'));
        }
    };

    return (
        <header id={styles.header} onClick={handleHeaderClick}>
            <div className={`${styles.container} container`}>
                <div id={styles.header_version_wrapper}>
                    <h1 id={styles.page_header}>Isk master</h1>
                    <div id="version">
                        <span>v:1.0</span>
                    </div>
                </div>
                <nav id={styles.nav}>
                    {links.map((link, index) => (
                        <Link key={index} href={link.href} text={link.text} />
                    ))}
                </nav>
                <div id={styles.header_options_wrapper}>
                    <Button value="#" text="Options" />
                </div>
            </div>
        </header>
    );
}
