const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8080";

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

        throw new Error(message);
    }

    if (skipJson || response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}