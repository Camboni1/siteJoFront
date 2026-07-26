import { CustomerVehicleList } from "@/features/customer-vehicles/components/customer-vehicle-list";

const SUCCESS_MESSAGES: Record<string, string> = {
    created: "Le véhicule a bien été ajouté.",
    updated: "Les modifications du véhicule ont bien été enregistrées.",
    deactivated: "Le véhicule a bien été désactivé.",
};

export default async function CustomerVehiclesPage({
    searchParams,
}: {
    searchParams: Promise<{ result?: string | string[] }>;
}) {
    const result = (await searchParams).result;
    const resultKey = Array.isArray(result) ? result[0] : result;

    return (
        <CustomerVehicleList
            successMessage={
                resultKey ? SUCCESS_MESSAGES[resultKey] : undefined
            }
        />
    );
}
