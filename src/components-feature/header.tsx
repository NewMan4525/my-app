import styles from './css/header.module.css';

import Link from '@/src/components-generic/link';
import Button from '@/src/components-generic/button';
export default function Header() {
    const links = [
        { href: 'user', text: 'User' },
        { href: 'buy', text: 'Buy' },
        { href: 'sell', text: 'Sell' },
        { href: 'war', text: '0.01 isk war' },
    ];
    const btns = [{ value: '#', text: 'Options' }];

    return (
        <header id={styles.header}>
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
                    {btns.map((btn, index) => (
                        <Button key={index} value={btn.value} text={btn.text} />
                    ))}
                </div>
            </div>
        </header>
    );
}
