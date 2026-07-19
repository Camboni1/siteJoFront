const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

export function isApiError(error: unknown, status?: number): error is ApiError {
    return (
        error instanceof ApiError &&
        (status === undefined || error.status === status)
    );
}

type ApiOptions = RequestInit & {
    skipJson?: boolean;
};

export async function apiFetch<T>(
    path: string,
    options: ApiOptions = {}
): Promise<T> {
    const { skipJson, headers, ...fetchOptions } = options;

    const response = await fetch(`${API_URL}${path}`, {
        ...fetchOptions,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
    });

    if (!response.ok) {
        let message = `Erreur API ${response.status}`;

        try {
            const errorBody = await response.json();

            if (errorBody.message) {
                message = errorBody.message;
            } else if (errorBody.error) {
                message = errorBody.error;
            }
        } catch {
            // pas de body JSON
        }

        throw new ApiError(message, response.status);
    }

    if (skipJson || response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}