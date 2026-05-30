// ./src/utils/classes.ts
import { IInputProps, HTMLInputType } from '@/src/types/frontInterfaces';
import { formatUnderscores, toTitleCase } from '@/src/utils/helpers';

interface IOption {
    groupName?: string;
    name: string;
    text?: string;
    value?: string;
    defaultValue?: string | number;
    defaultChecked?: boolean;
}

interface IInputItem {
    type: HTMLInputType; // Исправлено: строго привязываем к валидным HTML-инпутам
    options: IOption[];
}

export class InputsBlockOptionCreator {
    h3: string;
    inputsProps: IInputProps[][];

    constructor(headerText: string, inputs: IInputItem[]) {
        this.h3 = formatUnderscores(headerText).toUpperCase();

        this.inputsProps = inputs.map((input, i) =>
            this.optionSet(headerText, input, i),
        );
    }

    private optionSet(
        headerText: string,
        input: IInputItem,
        key: number,
    ): IInputProps[] {
        return input.options.map((it) => ({
            groupName:
                it.groupName !== undefined && it.groupName !== null
                    ? toTitleCase(it.groupName)
                    : '',
            inputType: input.type, // Теперь типы совпадают идеально без cast-операторов
            labelText: toTitleCase(it.text ?? headerText),
            inputName: it.name + String(key),
            alias: it.text
                ? headerText + '_' + it.text
                : headerText + '_' + String(key),
            defaultValue: it.defaultValue,
            defaultChecked: it.defaultChecked,
        }));
    }
}
