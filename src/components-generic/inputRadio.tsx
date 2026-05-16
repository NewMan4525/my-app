import styles from './css/inputRadio.module.css';
interface Props {
    options:
        | {
              groupName?: string;
              inputType: string;
              labelText: string;
              inputName: string;
              alias: string;
              defaultChecked?: boolean;
          }[]
        | undefined;
}
export default function InputRadio({ options }: Props) {
    return (
        <div className={styles.input_container}>
            <span className={styles.groupNameInputOption}>
                {options?.[0]?.groupName ?? ''}
            </span>

            <div className={styles.options_wrapper}>
                {options?.map((item, i) => (
                    <label
                        className={styles.labelInputOption}
                        key={i}
                        htmlFor={item.inputName + i}
                    >
                        {item.labelText}
                        <input
                            className={styles.inputOption}
                            type="radio"
                            value={i + 1}
                            id={item.inputName + i}
                            name={item.inputName}
                            defaultChecked={Boolean(item.defaultChecked)}
                        />
                    </label>
                ))}
            </div>
        </div>
    );
}
