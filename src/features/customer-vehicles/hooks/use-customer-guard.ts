"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { isCustomer } from "@/features/auth/lib/roles";

export function useCustomerGuard() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (loading) {
            return;
        }

        if (!user) {
            router.replace("/login");
        } else if (!isCustomer(user)) {
            router.replace("/dashboard");
        }
    }, [loading, user, router]);

    return {
        user,
        loading,
        authorized: !loading && Boolean(user && isCustomer(user)),
    };
}
