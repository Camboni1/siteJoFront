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

export function formatDateTime(isoDate: string) {
    return dateTimeFormatter.format(new Date(isoDate));
}

export function formatDate(isoDate: string) {
    return dateFormatter.format(new Date(isoDate));
}

export function formatTime(isoDate: string) {
    return timeFormatter.format(new Date(isoDate));
}
