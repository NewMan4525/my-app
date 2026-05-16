import styles from './css/inputsBlock.module.css';
import { IInputProps } from '@/src/types/FrontInterfaces';
import InputRadio from '@/src/components-generic/inputRadio';
import InputNumber from '@/src/components-generic/inputNumber';
import InputText from '@/src/components-generic/inputText';
import InputSubmit from '@/src/components-generic/inputSubmit';
import InputReset from '@/src/components-generic/inputReset';
import InputButton from '@/src/components-generic/inputButton';
interface Props {
    h3: string;
    inputsProps: IInputProps[][];
}

export default function InputsBlock({ h3, inputsProps }: Props) {
    const inputCalc = (inputProps: IInputProps[]) => {
        switch (inputProps[0].inputType) {
            case 'number':
                return <InputNumber options={inputProps[0]} />;
            case 'text':
                return <InputText options={inputProps[0]} />;
            case 'submit':
                return <InputSubmit options={inputProps[0]} />;
            case 'reset':
                return <InputReset options={inputProps[0]} />;
            case 'button':
                return <InputButton options={inputProps[0]} />;
            case 'radio':
                return <InputRadio options={inputProps} />;
        }
    };
    return (
        <div className={styles.input_block}>
            <h3 className={styles.input_block_header}>{h3}</h3>
            <div className={styles.inputs_flex}>
                {inputsProps.map((inputProps: IInputProps[], i: number) => {
                    return (
                        <div key={i} className={styles.inputs_flexbox}>
                            {inputCalc(inputProps)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
