import styles from './css/inputNumber.module.css';
interface Props {
    options: {
        labelText: string;
        inputName: string;
        alias: string;
        defaultValue?: string;
    };
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
                    defaultValue={options.defaultValue}
                />
            </label>
        </div>
    );
}
