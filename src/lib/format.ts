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

export function formatDateTime(isoDate: string) {
    return dateTimeFormatter.format(new Date(isoDate));
}

export function formatDate(isoDate: string) {
    return dateFormatter.format(new Date(isoDate));
}

export function formatTime(isoDate: string) {
    return timeFormatter.format(new Date(isoDate));
}
