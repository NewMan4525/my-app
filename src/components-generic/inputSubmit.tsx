import styles from './css/inputNumber.module.css';
interface Props {
    options: {
        inputType: string;
        labelText: string;
        inputName: string;
        alias: string;
        defaultValue?: string;
    };
}
export default function InputSubmit({ options }: Props) {
    return (
        <div className={styles.input_container}>
            <label className={styles.labelInputNumber} htmlFor={options.alias}>
                {options.labelText}
                <input
                    className={styles.inputNumber}
                    id={options.alias}
                    placeholder="0"
                    type="submit"
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
