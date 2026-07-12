import { apiFetch } from "@/lib/api";
import type { GarageService } from "@/features/garage-services/types/garage-service.types";

export function getActiveServices() {
    return apiFetch<GarageService[]>("/api/v1/garage-services", {
        method: "GET",
    });
}
