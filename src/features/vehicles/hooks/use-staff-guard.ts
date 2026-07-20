"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { isStaff } from "@/features/auth/lib/roles";

export function useStaffGuard() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (loading) {
            return;
        }

        if (!user) {
            router.push("/login");
        } else if (!isStaff(user)) {
            router.push("/dashboard");
        }
    }, [loading, user, router]);

    return {
        user,
        loading,
        authorized: !loading && Boolean(user && isStaff(user)),
    };
}
