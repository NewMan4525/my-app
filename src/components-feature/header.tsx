// components-feature/header.tsx
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

    // Функция-обработчик клика на шапке
    const handleHeaderClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;

        // Проверяем, что кликнули именно по кнопке Options
        if (target.tagName === 'BUTTON' && target.textContent === 'Options') {
            if (pathname === '/buy') {
                // Создаем и отправляем кастомное событие в рамках окна браузера
                const event = new CustomEvent('toggle-market-options');
                window.dispatchEvent(event);
            }
        }
    };

    return (
        // Вешаем один обработчик на обертку шапки
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
                    {/* Компонент Button рендерит нативный <button>Options</button> */}
                    <Button value="#" text="Options" />
                </div>
            </div>
        </header>
    );
}
