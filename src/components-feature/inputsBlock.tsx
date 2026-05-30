// ./src/components-feature/inputsBlock.tsx
import styles from './css/inputsBlock.module.css';
import { IInputProps } from '@/src/types/frontInterfaces';
import { FormInputItem } from './formInputItem';

interface Props {
    h3: string;
    inputsProps: IInputProps[][];
    values: Record<string, number>;
    onNumberChange: (name: string, value: number) => void;
    onRadioChange: (groupName: string, value: number) => void;
}

export default function InputsBlock({
    h3,
    inputsProps,
    values,
    onNumberChange,
    onRadioChange,
}: Props) {
    return (
        <div className={styles.input_block}>
            <h3 className={styles.input_block_header}>{h3}</h3>
            <div className={styles.inputs_flex}>
                {inputsProps.map((inputGroup: IInputProps[], i: number) => (
                    <div key={i} className={styles.inputs_flexbox}>
                        {/* Изолированный рендеринг: перерисуется строго изменившийся элемент */}
                        <FormInputItem
                            inputProps={inputGroup}
                            values={values}
                            onNumberChange={onNumberChange}
                            onRadioChange={onRadioChange}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
