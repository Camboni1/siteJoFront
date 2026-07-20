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

async function errorFromResponse(response: Response): Promise<ApiError> {
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

    return new ApiError(message, response.status);
}

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
        throw await errorFromResponse(response);
    }

    if (skipJson || response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

export type ApiBlobResult = {
    blob: Blob;
    /**
     * Nom de fichier extrait de Content-Disposition, si le navigateur
     * y a accès (en cross-origin, l'en-tête peut ne pas être exposé).
     */
    filename: string | null;
};

export async function apiFetchBlob(path: string): Promise<ApiBlobResult> {
    const response = await fetch(`${API_URL}${path}`, {
        credentials: "include",
    });

    if (!response.ok) {
        throw await errorFromResponse(response);
    }

    return {
        blob: await response.blob(),
        filename: filenameFromContentDisposition(
            response.headers.get("content-disposition")
        ),
    };
}

function filenameFromContentDisposition(header: string | null) {
    if (!header) {
        return null;
    }

    const encodedMatch = header.match(/filename\*\s*=\s*utf-8''([^;]+)/i);

    if (encodedMatch) {
        try {
            return decodeURIComponent(encodedMatch[1].trim());
        } catch {
            // valeur mal encodée : on retombe sur filename=
        }
    }

    const plainMatch = header.match(/(?:^|;)\s*filename\s*=\s*"?([^";]+)"?/i);

    return plainMatch ? plainMatch[1].trim() : null;
}