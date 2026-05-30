// ./src/components-feature/formInputItem.tsx
'use client';

import React from 'react';
import { IInputProps } from '@/src/types/frontInterfaces';
import InputRadio from '@/src/components-generic/inputRadio';
import InputNumber from '@/src/components-generic/inputNumber';
import InputSubmit from '@/src/components-generic/inputSubmit';
import InputButton from '@/src/components-generic/inputButton';
import InputReset from '@/src/components-generic/inputReset';

interface FormInputItemProps {
    inputProps: IInputProps[];
    values: Record<string, number>;
    onNumberChange: (name: string, value: number) => void;
    onRadioChange: (groupName: string, value: number) => void;
}

function FormInputItemComponent({
    inputProps,
    values,
    onNumberChange,
    onRadioChange,
}: FormInputItemProps) {
    const firstInput = inputProps[0];
    if (!firstInput) return null;

    const inputName = firstInput.inputName;

    switch (firstInput.inputType) {
        case 'number':
            return (
                <InputNumber
                    options={firstInput as IInputProps<number>}
                    value={values[inputName] ?? 0}
                    onChange={onNumberChange}
                />
            );
        case 'radio':
            return (
                <InputRadio
                    options={inputProps as IInputProps<number>[]}
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
}

// Обертывание в React.memo гарантирует 0 мс задержки и блокирует ререндер, если пропсы не изменились
export const FormInputItem = React.memo(
    FormInputItemComponent,
    (prevProps, nextProps) => {
        const prevFirst = prevProps.inputProps[0];
        const nextFirst = nextProps.inputProps[0];

        if (!prevFirst || !nextFirst) return false;

        // Если это кнопка без привязки к стейту, ререндер не нужен вовсе
        if (
            prevFirst.inputType === 'submit' ||
            prevFirst.inputType === 'reset' ||
            prevFirst.inputType === 'button'
        ) {
            return true;
        }

        const inputName = prevFirst.inputName;
        // Сравниваем только точечное значение конкретного инпута в стейте, игнорируя изменения в соседних полях
        return (
            prevProps.values[inputName] === nextProps.values[inputName] &&
            prevProps.inputProps === nextProps.inputProps
        );
    },
);
