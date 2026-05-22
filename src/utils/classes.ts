// ./src/utils/classes.ts
import { IInputProps } from '@/src/types/frontInterfaces';

interface IOption {
    groupName?: string;
    name: string;
    text?: string;
    value?: string;
    defaultValue?: string | number;
    defaultChecked?: boolean;
}
interface IInputItem {
    type: string;
    options: IOption[];
}

export class InputsBlockOptionCreator {
    h3: string;
    inputsProps: IInputProps[][];

    constructor(headerText: string, inputs: IInputItem[]) {
        this.h3 = this.prepareH3(headerText);

        this.inputsProps = inputs.map((input, i) =>
            this.optionSet(headerText, input, i),
        );
    }

    private setCapitalLetter(w: string): string {
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }

    private prepareH3(headerText: string): string {
        return headerText.replace(/_/g, ' ').toUpperCase();
    }

    private prepareLabelText(headerText: string): string {
        return headerText
            .replace(/_/g, ' ')
            .replace(/(^\w|\s\w)/g, (match) => match.toUpperCase());
    }

    private optionSet(
        headerText: string,
        input: IInputItem,
        key: number,
    ): IInputProps[] {
        return input.options.map((it) => ({
            groupName: this.prepareLabelText(it.groupName ?? ''),
            inputType: input.type,
            labelText: this.prepareLabelText(it.text ?? headerText),
            // ВОЗВРАЩАЕМ ОРИГИНАЛЬНУЮ СТРОГУЮ СБОРКУ: Индекс key критически важен для MPA-разделения групп
            inputName: it.name + String(key),
            alias: it.text
                ? headerText + '_' + it.text
                : headerText + '_' + String(key),
            defaultValue: it.defaultValue,
            defaultChecked: it.defaultChecked,
        }));
    }
}
