interface Props {
    options: {
        inputType: string;
        labelText: string;
        inputName: string;
        alias: string;
        defaultValue?: string;
    };
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
