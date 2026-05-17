import styles from './css/inputNumber.module.css';

interface Props {
    options: {
        inputType: string;
        labelText: string;
        inputName: string;
        alias: string;
    };
    value: number; // Передаем текущее значение из стейта страницы
    onChange: (name: string, value: number) => void; // Колбэк для изменения
}

export default function InputNumber({ options, value, onChange }: Props) {
    return (
        <div className={styles.input_container}>
            <label className={styles.labelInputNumber} htmlFor={options.alias}>
                {options.labelText}
                <input
                    className={styles.inputNumber}
                    id={options.alias}
                    placeholder="0"
                    type="number"
                    name={options.inputName}
                    value={value} // Меняем defaultValue на value
                    onChange={(e) =>
                        onChange(options.inputName, Number(e.target.value))
                    }
                />
            </label>
        </div>
    );
}
