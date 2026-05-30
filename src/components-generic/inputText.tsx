// ./src/components-generic/inputText.tsx
import { IInputProps } from '@/src/types/frontInterfaces';

interface Props {
    options: IInputProps<string>; // Используем строгий глобальный дженерик-интерфейс, зафиксированный на string
}

export default function InputText({ options }: Props) {
    return (
        <label htmlFor={options.alias}>
            {options.labelText}
            <input
                id={options.alias}
                placeholder={undefined}
                type="text"
                name={options.inputName}
                defaultValue={options.defaultValue}
            />
        </label>
    );
}
