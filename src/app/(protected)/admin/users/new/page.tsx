"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { isAdmin } from "@/features/auth/lib/roles";
import * as usersApi from "@/features/users/api/users-api";
import {
    UserForm,
    type UserFormSubmitValues,
} from "@/features/users/components/user-form";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingScreen } from "@/components/ui/loading-screen";

export default function NewUserPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

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

    if (loading || !user || !isAdmin(user)) {
        return <LoadingScreen />;
    }

    async function handleSubmit(values: UserFormSubmitValues) {
        if (!values.password) {
            return;
        }

        await usersApi.createUser({
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            role: values.role,
            enabled: values.enabled,
            password: values.password,
        });

        router.push("/admin/users");
    }

    return (
        <main className="flex-1">
            <PageHeader
                title="Nouvel utilisateur"
                backHref="/admin/users"
                backLabel="Utilisateurs"
            />

            <section className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-10">
                <UserForm
                    mode="create"
                    submitLabel="Créer l'utilisateur"
                    submittingLabel="Création..."
                    onSubmit={handleSubmit}
                    onCancel={() => router.push("/admin/users")}
                />
            </section>
        </main>
    );
}
