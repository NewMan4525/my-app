import styles from './css/button.module.css';

interface BtnProps {
    value: string;
    text: string;
}

export default function Button({ value, text }: BtnProps) {
    return (
        <div className={styles.button_wrapper}>
            <button value={value}>{text}</button>
        </div>
    );
}
