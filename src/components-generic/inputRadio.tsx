// ./src/components-generic/inputRadio.tsx
import styles from './css/inputRadio.module.css';
import { IInputProps } from '@/src/types/frontInterfaces';

interface Props {
    options: IInputProps<number>[] | undefined; // Используем строгий глобальный дженерик-интерфейс
    value: number;
    onChange: (name: string, value: number) => void;
}

export default function InputRadio({ options, value, onChange }: Props) {
    if (!options || options.length === 0) return null;

    const groupNameAttr = options[0].groupName ?? '';

    return (
        <div className={styles.input_container}>
            <span className={styles.groupNameInputOption}>{groupNameAttr}</span>

            <div className={styles.options_wrapper}>
                {options.map((item, i) => {
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
                                checked={value === currentLvl}
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
