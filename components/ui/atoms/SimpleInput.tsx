
import React from 'react';

interface SimpleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    className?: string; // Para permitir overrides de clases contenedoras
    inputClassName?: string; // Para clases específicas del input si necesario
}

export function SimpleInput({
    label,
    error,
    className = "",
    inputClassName = "",
    id,
    ...props
}: SimpleInputProps) {
    const inputId = id || props.name || Math.random().toString(36).substr(2, 9);

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="text-sm font-medium text-gray-300 ml-1"
                >
                    {label}
                </label>
            )}

            <input
                id={inputId}
                className={`
                    bg-[#1A1D24] 
                    border border-gray-700 
                    text-gray-100 
                    text-sm 
                    rounded-lg 
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                    block w-full p-2.5 
                    placeholder-gray-500
                    transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
                    ${inputClassName}
                `}
                {...props}
            />

            {error && (
                <p className="mt-1 text-xs text-red-400 ml-1 animate-in slide-in-from-top-1 fade-in">
                    {error}
                </p>
            )}
        </div>
    );
}

export default SimpleInput;
