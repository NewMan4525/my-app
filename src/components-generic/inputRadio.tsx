import styles from './css/inputRadio.module.css';

interface Props {
    options:
        | {
              groupName?: string;
              inputType: string;
              labelText: string;
              inputName: string;
              alias: string;
          }[]
        | undefined;
    value: number; // Текущий выбранный уровень (1-5)
    onChange: (groupName: string, value: number) => void; // Колбэк
}

export default function InputRadio({ options, value, onChange }: Props) {
    const groupNameAttr = options?.[0]?.groupName ?? '';

    return (
        <div className={styles.input_container}>
            <span className={styles.groupNameInputOption}>{groupNameAttr}</span>

            <div className={styles.options_wrapper}>
                {options?.map((item, i) => {
                    const currentLvl = i + 1;
                    return (
                        <label
                            className={styles.labelInputOption}
                            key={i}
                            htmlFor={item.inputName + i}
                        >
                            {item.labelText}
                            <input
                                className={styles.inputOption}
                                type="radio"
                                value={currentLvl}
                                id={item.inputName + i}
                                name={item.inputName}
                                checked={value === currentLvl} // Меняем defaultChecked на checked
                                onChange={() =>
                                    onChange(item.inputName, currentLvl)
                                }
                            />
                        </label>
                    );
                })}
            </div>
        </div>
    );
}
