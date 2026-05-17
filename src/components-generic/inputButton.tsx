// components-generic/inputButton.tsx
import styles from './css/inputNumber.module.css';
import { IInputProps } from '@/src/types/frontInterfaces';

interface Props {
    options: IInputProps; // Привязали к общему типу
}

export default function InputButton({ options }: Props) {
    return (
        <div className={styles.input_container}>
            <label className={styles.labelInputNumber} htmlFor={options.alias}>
                {options.labelText}
                <input
                    className={styles.inputNumber}
                    id={options.alias}
                    placeholder="0"
                    type="button"
                    name={options.inputName}
                    defaultValue={options.defaultValue} // Теперь принимает string | number
                />
            </label>
        </div>
    );
}
