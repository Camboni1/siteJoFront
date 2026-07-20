const dateTimeFormatter = new Intl.DateTimeFormat("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("fr-BE", {
    hour: "2-digit",
    minute: "2-digit",
});

const currencyFormatter = new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
});

const shortDateFormatter = new Intl.DateTimeFormat("fr-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
});

const currencyFormatters = new Map<string, Intl.NumberFormat>();

const integerFormatter = new Intl.NumberFormat("fr-BE", {
    maximumFractionDigits: 0,
});

export function formatDuration(minutes: number) {
    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return remainingMinutes === 0
        ? `${hours} h`
        : `${hours} h ${remainingMinutes} min`;
}

export function formatPrice(amount: number) {
    return currencyFormatter.format(amount);
}

export function formatCurrency(amount: number, currency: string) {
    let formatter = currencyFormatters.get(currency);

    if (!formatter) {
        try {
            formatter = new Intl.NumberFormat("fr-BE", {
                style: "currency",
                currency,
            });
        } catch {
            // Devise inconnue d'Intl : repli lisible sans planter l'affichage.
            return `${amount.toFixed(2)} ${currency}`;
        }

        currencyFormatters.set(currency, formatter);
    }

    return formatter.format(amount);
}

export function formatMileage(mileage: number) {
    return `${integerFormatter.format(mileage)} km`;
}

export function formatDateTime(isoDate: string) {
    return dateTimeFormatter.format(new Date(isoDate));
}

export function formatDate(isoDate: string) {
    return dateFormatter.format(new Date(isoDate));
}

export function formatDateShort(isoDate: string) {
    return shortDateFormatter.format(new Date(isoDate));
}

export function formatTime(isoDate: string) {
    return timeFormatter.format(new Date(isoDate));
}
