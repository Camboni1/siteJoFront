export type Customer = {
    id: string;
    appUserId: string | null;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    street: string | null;
    postalCode: string | null;
    city: string | null;
    country: string | null;
    vatNumber: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
};

export type CustomerRequest = {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    street: string | null;
    postalCode: string | null;
    city: string | null;
    country: string | null;
    vatNumber: string | null;
    notes: string | null;
};
