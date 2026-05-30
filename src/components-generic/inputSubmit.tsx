// ./src/components-generic/inputSubmit.tsx
import styles from './css/inputNumber.module.css';
import { IInputProps } from '@/src/types/frontInterfaces';

interface Props {
    options: IInputProps;
}

export default function InputSubmit({ options }: Props) {
    return (
        <div className={styles.input_container}>
            <label className={styles.labelInputNumber} htmlFor={options.alias}>
                {options.labelText}
                <input
                    className={styles.inputNumber}
                    id={options.alias}
                    type="submit"
                    name={options.inputName}
                    defaultValue={options.defaultValue}
                    data-action="save-options"
                />
            </label>
        </div>
    );
}
