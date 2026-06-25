export type UserRole = "ROLE_ADMIN" | "ROLE_EMPLOYEE" | "ROLE_CUSTOMER";

export type AuthUser = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
};

export type LoginRequest = {
    email: string;
    password: string;
};

export type RegisterRequest = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
};