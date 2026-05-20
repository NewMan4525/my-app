// src/types/frontInterfaces
export interface IInputProps {
    inputType: string;
    labelText: string;
    inputName: string;
    alias: string;
    groupName?: string;
    defaultChecked?: boolean;
    defaultValue?: string | number;
}
export interface IUserSkills {
    broker_relationship: number;
    advanced_broker_relationship: number;
    accounting: number;
}
