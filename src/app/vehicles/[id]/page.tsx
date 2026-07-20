"use client";

import { useParams } from "next/navigation";
import { VehicleDetail } from "@/features/vehicles/components/public/vehicle-detail";

export default function VehicleDetailPage() {
    const { id } = useParams<{ id: string }>();

    return <VehicleDetail id={id} />;
}
