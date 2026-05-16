import styles from './css/inputNumber.module.css';
interface Props {
    options: {
        labelText: string;
        inputName: string;
        alias: string;
        defaultValue?: string;
    };
}
export default function InputReset({ options }: Props) {
    return (
        <div className={styles.input_container}>
            <label className={styles.labelInputNumber} htmlFor={options.alias}>
                {options.labelText}
                <input
                    className={styles.inputNumber}
                    id={options.alias}
                    type="reset"
                    name={options.inputName}
                    defaultValue={options.defaultValue}
                />
            </label>
        </div>
    );
}
//inputName
//labelText
//alias
