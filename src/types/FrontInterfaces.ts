// src/types/frontInterfaces.ts

// Расширяем список валидных типов HTML-инпута для поддержки кнопок формы
export type HTMLInputType =
    | 'text'
    | 'number'
    | 'checkbox'
    | 'radio'
    | 'range'
    | 'hidden'
    | 'submit'
    | 'reset'
    | 'button';

export interface IInputProps<
    T extends string | number | boolean = string | number,
> {
    inputType: HTMLInputType;
    labelText: string;
    inputName: string;
    alias: string;
    groupName?: string;
    defaultChecked?: boolean;
    defaultValue?: T;
}

export interface IUserSkills {
    broker_relationship?: number;
    advanced_broker_relationship?: number;
    accounting?: number;
}
