"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { isAdmin } from "@/features/auth/lib/roles";
import { isApiError } from "@/lib/api";
import * as usersApi from "@/features/users/api/users-api";
import type { AdminUser } from "@/features/users/types/user.types";
import {
    UserForm,
    validatePassword,
    type UserFormSubmitValues,
} from "@/features/users/components/user-form";
import { PasswordInput } from "@/features/users/components/password-input";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingScreen } from "@/components/ui/loading-screen";

export default function EditUserPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const { user, loading, refreshUser } = useAuth();

    const [targetUser, setTargetUser] = useState<AdminUser | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [newPassword, setNewPassword] = useState("");
    const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordConfirmError, setPasswordConfirmError] = useState<
        string | null
    >(null);
    const [passwordApiError, setPasswordApiError] = useState<string | null>(
        null
    );
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(
        null
    );
    const [savingPassword, setSavingPassword] = useState(false);

    const isSelf = !!user && !!targetUser && user.id === targetUser.id;

    useEffect(() => {
        if (loading) {
            return;
        }

        if (!user) {
            router.push("/login");
        } else if (!isAdmin(user)) {
            router.push("/dashboard");
        }
    }, [loading, user, router]);

    useEffect(() => {
        if (!user || !isAdmin(user) || !params.id) {
            return;
        }

        usersApi
            .getUser(params.id)
            .then(setTargetUser)
            .catch((error) => {
                if (isApiError(error, 401)) {
                    router.push("/login");
                    return;
                }

                setError(
                    error instanceof Error
                        ? error.message
                        : "Utilisateur introuvable"
                );
            })
            .finally(() => setLoadingUser(false));
    }, [user, params.id, router]);

    async function handleSubmit(values: UserFormSubmitValues) {
        if (!targetUser) {
            return;
        }

        await usersApi.updateUser(targetUser.id, {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            role: values.role,
            enabled: values.enabled,
        });

        if (isSelf) {
            await refreshUser();
        }

        router.push("/admin/users");
    }

    function confirmDisable(values: UserFormSubmitValues) {
        const message = isSelf
            ? `Vous êtes sur le point de désactiver VOTRE PROPRE compte (${values.email}). Vous perdrez immédiatement l'accès à l'application. Continuer ?`
            : `Désactiver le compte de ${values.firstName} ${values.lastName} (${values.email}) ? Cette personne ne pourra plus se connecter.`;

        return window.confirm(message);
    }

    async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!targetUser) {
            return;
        }

        setPasswordApiError(null);
        setPasswordSuccess(null);

        const validationError = validatePassword(newPassword);

        if (validationError) {
            setPasswordError(validationError);
            return;
        }

        if (newPassword !== newPasswordConfirm) {
            setPasswordConfirmError(
                "La confirmation ne correspond pas au mot de passe"
            );
            return;
        }

        setSavingPassword(true);

        try {
            await usersApi.updateUserPassword(targetUser.id, newPassword);

            setNewPassword("");
            setNewPasswordConfirm("");
            setPasswordSuccess(
                "Le nouveau mot de passe est enregistré. Communiquez-le par un canal sûr."
            );
        } catch (error) {
            if (isApiError(error, 401)) {
                router.push("/login");
                return;
            }

            setPasswordApiError(
                error instanceof Error
                    ? error.message
                    : "Impossible de modifier le mot de passe"
            );
        } finally {
            setSavingPassword(false);
        }
    }

    if (loading || !user || !isAdmin(user)) {
        return <LoadingScreen />;
    }

    return (
        <main className="flex-1">
            <PageHeader
                title="Modifier l'utilisateur"
                backHref="/admin/users"
                backLabel="Utilisateurs"
            />

            <section className="mx-auto max-w-3xl space-y-6 px-5 py-8 sm:px-6 sm:py-10">
                {error && <div className="alert-error">{error}</div>}

                {loadingUser ? (
                    <div className="empty-state">Chargement...</div>
                ) : !targetUser ? (
                    <div className="empty-state">
                        Cet utilisateur est introuvable.
                    </div>
                ) : (
                    <>
                        {isSelf && (
                            <div
                                className="rounded-xl border border-accent/30 bg-accent/8 px-4 py-3 text-sm text-accent"
                                role="alert"
                            >
                                Vous modifiez votre propre compte. Changer
                                votre rôle ou désactiver ce compte peut vous
                                faire perdre l&apos;accès à cette
                                administration.
                            </div>
                        )}

                        <UserForm
                            mode="edit"
                            initialValues={targetUser}
                            submitLabel="Enregistrer les modifications"
                            submittingLabel="Enregistrement..."
                            onSubmit={handleSubmit}
                            onCancel={() => router.push("/admin/users")}
                            confirmDisable={confirmDisable}
                        />

                        <form
                            onSubmit={handlePasswordSubmit}
                            className="card"
                            noValidate
                        >
                            <p className="section-title">Sécurité</p>
                            <h2 className="mt-2 text-lg font-semibold">
                                Définir un nouveau mot de passe
                            </h2>
                            <p className="mt-2 text-xs text-muted">
                                Le mot de passe actuel n&apos;est jamais
                                affiché. Ce formulaire le remplace
                                définitivement.
                            </p>

                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <PasswordInput
                                    id="edit-user-password"
                                    label="Nouveau mot de passe"
                                    value={newPassword}
                                    onChange={(value) => {
                                        setNewPassword(value);
                                        setPasswordError(null);
                                    }}
                                    error={passwordError ?? undefined}
                                />
                                <PasswordInput
                                    id="edit-user-password-confirm"
                                    label="Confirmer le mot de passe"
                                    value={newPasswordConfirm}
                                    onChange={(value) => {
                                        setNewPasswordConfirm(value);
                                        setPasswordConfirmError(null);
                                    }}
                                    error={passwordConfirmError ?? undefined}
                                />
                            </div>

                            {passwordApiError && (
                                <div
                                    className="alert-error mt-4"
                                    role="alert"
                                >
                                    {passwordApiError}
                                </div>
                            )}
                            {passwordSuccess && (
                                <div
                                    className="alert-success mt-4"
                                    role="status"
                                >
                                    {passwordSuccess}
                                </div>
                            )}

                            <div className="mt-5 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={savingPassword}
                                    className="btn-ghost"
                                >
                                    {savingPassword
                                        ? "Enregistrement..."
                                        : "Remplacer le mot de passe"}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </section>
        </main>
    );
}
