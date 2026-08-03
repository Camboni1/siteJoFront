export const GARAGE_PHONE_DISPLAY = "+32 81 12 34 56";
export const GARAGE_PHONE_HREF = "tel:+3281123456";

const GARAGE_WHATSAPP_BASE_URL = "https://wa.me/32475123456";

export function garageWhatsAppHref(message?: string) {
    const normalizedMessage = message?.trim();

    return normalizedMessage
        ? `${GARAGE_WHATSAPP_BASE_URL}?text=${encodeURIComponent(normalizedMessage)}`
        : GARAGE_WHATSAPP_BASE_URL;
}
