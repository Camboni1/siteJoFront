"use client";

import { useState } from "react";

type PasswordInputProps = {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    autoComplete?: string;
    required?: boolean;
};

export function PasswordInput({
    id,
    label,
    value,
    onChange,
    error,
    autoComplete = "new-password",
    required,
}: PasswordInputProps) {
    const [visible, setVisible] = useState(false);
    const errorId = `${id}-error`;

    return (
        <div>
            <label className="field-label" htmlFor={id}>
                {label}
                {required && (
                    <span aria-hidden className="text-accent">
                        {" "}
                        *
                    </span>
                )}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type={visible ? "text" : "password"}
                    className="input pr-24"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    autoComplete={autoComplete}
                    aria-required={required}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                />
                <button
                    type="button"
                    onClick={() => setVisible((current) => !current)}
                    aria-pressed={visible}
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md border border-line bg-surface-raised px-2.5 py-1 text-xs font-medium text-muted transition hover:border-faint hover:text-ink"
                >
                    {visible ? "Masquer" : "Afficher"}
                </button>
            </div>
            {error && (
                <p id={errorId} className="mt-1.5 text-xs text-red-300">
                    {error}
                </p>
            )}
        </div>
    );
}
