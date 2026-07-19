"use client";

import { FormEvent, useId, useState } from "react";
import type { UserRole } from "@/features/auth/types/auth.types";
import { ROLE_LABELS } from "@/features/auth/lib/roles";
import type { AdminUser } from "@/features/users/types/user.types";
import { PasswordInput } from "@/features/users/components/password-input";

const NAME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 180;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 100;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALL_ROLES = Object.keys(ROLE_LABELS) as UserRole[];

export type UserFormSubmitValues = {
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    enabled: boolean;
    password: string | null;
};

type FieldErrors = Partial<
    Record<
        "firstName" | "lastName" | "email" | "password" | "passwordConfirm",
        string
    >
>;

export function validatePassword(password: string): string | null {
    if (!password) {
        return "Le mot de passe est obligatoire";
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
        return `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères`;
    }

    if (password.length > PASSWORD_MAX_LENGTH) {
        return `Le mot de passe ne peut pas dépasser ${PASSWORD_MAX_LENGTH} caractères`;
    }

    return null;
}

type UserFormProps = {
    mode: "create" | "edit";
    initialValues?: AdminUser;
    submitLabel: string;
    submittingLabel: string;
    onSubmit: (values: UserFormSubmitValues) => Promise<void>;
    onCancel: () => void;
    confirmDisable?: (values: UserFormSubmitValues) => boolean;
};

export function UserForm({
    mode,
    initialValues,
    submitLabel,
    submittingLabel,
    onSubmit,
    onCancel,
    confirmDisable,
}: UserFormProps) {
    const formId = useId();

    const [firstName, setFirstName] = useState(
        initialValues?.firstName ?? ""
    );
    const [lastName, setLastName] = useState(initialValues?.lastName ?? "");
    const [email, setEmail] = useState(initialValues?.email ?? "");
    const [role, setRole] = useState<UserRole>(
        initialValues?.role ?? "ROLE_EMPLOYEE"
    );
    const [enabled, setEnabled] = useState(initialValues?.enabled ?? true);
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [apiError, setApiError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    function validate(): FieldErrors {
        const errors: FieldErrors = {};

        if (!firstName.trim()) {
            errors.firstName = "Le prénom est obligatoire";
        } else if (firstName.trim().length > NAME_MAX_LENGTH) {
            errors.firstName = `Le prénom ne peut pas dépasser ${NAME_MAX_LENGTH} caractères`;
        }

        if (!lastName.trim()) {
            errors.lastName = "Le nom est obligatoire";
        } else if (lastName.trim().length > NAME_MAX_LENGTH) {
            errors.lastName = `Le nom ne peut pas dépasser ${NAME_MAX_LENGTH} caractères`;
        }

        if (!email.trim()) {
            errors.email = "L'email est obligatoire";
        } else if (!EMAIL_PATTERN.test(email.trim())) {
            errors.email = "L'email doit être valide";
        } else if (email.trim().length > EMAIL_MAX_LENGTH) {
            errors.email = `L'email ne peut pas dépasser ${EMAIL_MAX_LENGTH} caractères`;
        }

        if (mode === "create") {
            const passwordError = validatePassword(password);

            if (passwordError) {
                errors.password = passwordError;
            } else if (password !== passwordConfirm) {
                errors.passwordConfirm =
                    "La confirmation ne correspond pas au mot de passe";
            }
        }

        return errors;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setApiError(null);

        const errors = validate();

        if (Object.values(errors).some(Boolean)) {
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});

        const values: UserFormSubmitValues = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            role,
            enabled,
            password: mode === "create" ? password : null,
        };

        if (
            !enabled &&
            initialValues?.enabled &&
            confirmDisable &&
            !confirmDisable(values)
        ) {
            return;
        }

        setSubmitting(true);

        try {
            await onSubmit(values);
        } catch (error) {
            setApiError(
                error instanceof Error
                    ? error.message
                    : "Impossible d'enregistrer l'utilisateur"
            );
            setSubmitting(false);
        }
    }

    function renderTextField(
        field: "firstName" | "lastName" | "email",
        label: string,
        value: string,
        setValue: (value: string) => void,
        options: {
            type?: string;
            autoComplete?: string;
            maxLength: number;
        }
    ) {
        const inputId = `${formId}-${field}`;
        const errorId = `${inputId}-error`;
        const error = fieldErrors[field];

        return (
            <div>
                <label className="field-label" htmlFor={inputId}>
                    {label}
                    <span aria-hidden className="text-accent">
                        {" "}
                        *
                    </span>
                </label>
                <input
                    id={inputId}
                    type={options.type ?? "text"}
                    className="input"
                    value={value}
                    onChange={(event) => {
                        setValue(event.target.value);
                        setFieldErrors((current) => ({
                            ...current,
                            [field]: undefined,
                        }));
                    }}
                    maxLength={options.maxLength}
                    autoComplete={options.autoComplete ?? "off"}
                    aria-required
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                />
                {error && (
                    <p id={errorId} className="mt-1.5 text-xs text-red-300">
                        {error}
                    </p>
                )}
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="card">
                <p className="section-title">Identité</p>
                <h2 className="mt-2 text-lg font-semibold">Utilisateur</h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {renderTextField("firstName", "Prénom", firstName, setFirstName, {
                        autoComplete: "given-name",
                        maxLength: NAME_MAX_LENGTH,
                    })}
                    {renderTextField("lastName", "Nom", lastName, setLastName, {
                        autoComplete: "family-name",
                        maxLength: NAME_MAX_LENGTH,
                    })}
                </div>

                <div className="mt-4">
                    {renderTextField("email", "Email", email, setEmail, {
                        type: "email",
                        autoComplete: "email",
                        maxLength: EMAIL_MAX_LENGTH,
                    })}
                </div>
            </div>

            <div className="card">
                <p className="section-title">Autorisations</p>
                <h2 className="mt-2 text-lg font-semibold">Rôle et accès</h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="field-label" htmlFor={`${formId}-role`}>
                            Rôle
                        </label>
                        <select
                            id={`${formId}-role`}
                            className="input"
                            value={role}
                            onChange={(event) =>
                                setRole(event.target.value as UserRole)
                            }
                        >
                            {ALL_ROLES.map((value) => (
                                <option key={value} value={value}>
                                    {ROLE_LABELS[value]}
                                </option>
                            ))}
                        </select>
                    </div>

                    <label
                        className="surface-muted flex cursor-pointer items-center justify-between gap-3"
                        htmlFor={`${formId}-enabled`}
                    >
                        <span>
                            <span className="block text-sm font-medium">
                                Compte actif
                            </span>
                            <span className="mt-1 block text-xs text-muted">
                                Un compte désactivé ne peut plus se connecter.
                            </span>
                        </span>
                        <input
                            id={`${formId}-enabled`}
                            type="checkbox"
                            className="h-5 w-5 accent-[#e8a04b]"
                            checked={enabled}
                            onChange={(event) =>
                                setEnabled(event.target.checked)
                            }
                        />
                    </label>
                </div>
            </div>

            {mode === "create" && (
                <div className="card">
                    <p className="section-title">Sécurité</p>
                    <h2 className="mt-2 text-lg font-semibold">
                        Mot de passe initial
                    </h2>
                    <p className="mt-2 text-xs text-muted">
                        Entre {PASSWORD_MIN_LENGTH} et {PASSWORD_MAX_LENGTH}{" "}
                        caractères. Communiquez-le à la personne concernée par
                        un canal sûr.
                    </p>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <PasswordInput
                            id={`${formId}-password`}
                            label="Mot de passe"
                            value={password}
                            onChange={(value) => {
                                setPassword(value);
                                setFieldErrors((current) => ({
                                    ...current,
                                    password: undefined,
                                }));
                            }}
                            error={fieldErrors.password}
                            required
                        />
                        <PasswordInput
                            id={`${formId}-password-confirm`}
                            label="Confirmer le mot de passe"
                            value={passwordConfirm}
                            onChange={(value) => {
                                setPasswordConfirm(value);
                                setFieldErrors((current) => ({
                                    ...current,
                                    passwordConfirm: undefined,
                                }));
                            }}
                            error={fieldErrors.passwordConfirm}
                            required
                        />
                    </div>
                </div>
            )}

            {apiError && (
                <div className="alert-error" role="alert">
                    {apiError}
                </div>
            )}

            <div className="flex flex-wrap justify-end gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    className="btn-ghost"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary"
                >
                    {submitting ? submittingLabel : submitLabel}
                </button>
            </div>
        </form>
    );
}
