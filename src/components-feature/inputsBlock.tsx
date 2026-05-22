// ./src/components-feature/inputsBlock.tsx
import styles from './css/inputsBlock.module.css';
import { IInputProps } from '@/src/types/frontInterfaces';
import InputRadio from '@/src/components-generic/inputRadio';
import InputNumber from '@/src/components-generic/inputNumber';
import InputSubmit from '@/src/components-generic/inputSubmit';
import InputButton from '@/src/components-generic/inputButton';
import InputReset from '@/src/components-generic/inputReset';

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
    const inputCalc = (inputProps: IInputProps[]) => {
        const firstInput = inputProps[0];
        if (!firstInput) return null;

        const inputName = firstInput.inputName;

        switch (firstInput.inputType) {
            case 'number':
                return (
                    <InputNumber
                        options={firstInput}
                        value={values[inputName] ?? 0}
                        onChange={onNumberChange}
                    />
                );
            case 'radio':
                return (
                    <InputRadio
                        options={inputProps}
                        value={values[inputName] ?? 1}
                        onChange={onRadioChange}
                    />
                );
            case 'submit':
                return <InputSubmit options={firstInput} />;
            case 'reset':
                return <InputReset options={firstInput} />;
            case 'button':
                return <InputButton options={firstInput} />;
            default:
                return null;
        }
    };

    return (
        <div className={styles.input_block}>
            <h3 className={styles.input_block_header}>{h3}</h3>
            <div className={styles.inputs_flex}>
                {inputsProps.map((inputProps: IInputProps[], i: number) => (
                    <div key={i} className={styles.inputs_flexbox}>
                        {inputCalc(inputProps)}
                    </div>
                ))}
            </div>
        </div>
    );
}
