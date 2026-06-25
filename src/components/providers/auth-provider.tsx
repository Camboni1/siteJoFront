"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

import type {
    AuthUser,
    LoginRequest,
    RegisterRequest,
} from "@/features/auth/types/auth.types";

import * as authApi from "@/features/auth/api/auth-api";

type AuthContextValue = {
    user: AuthUser | null;
    loading: boolean;
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    async function refreshUser() {
        try {
            const currentUser = await authApi.getMe();
            setUser(currentUser);
        } catch {
            setUser(null);
        }
    }

    async function handleLogin(data: LoginRequest) {
        const loggedUser = await authApi.login(data);
        setUser(loggedUser);
    }

    async function handleRegister(data: RegisterRequest) {
        const registeredUser = await authApi.register(data);
        setUser(registeredUser);
    }

    async function handleLogout() {
        await authApi.logout();
        setUser(null);
    }

    useEffect(() => {
        refreshUser().finally(() => setLoading(false));
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login: handleLogin,
                register: handleRegister,
                logout: handleLogout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth doit être utilisé dans AuthProvider");
    }

    return context;
}