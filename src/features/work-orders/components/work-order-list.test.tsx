import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/features/work-orders/api/work-orders-api");
vi.mock("@/features/vehicles/hooks/use-staff-guard");

const pushMock = vi.fn();
const replaceMock = vi.fn();
let searchKey = "";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: pushMock, replace: replaceMock }),
    usePathname: () => "/employee/work-orders",
    useSearchParams: () => new URLSearchParams(searchKey),
}));

import * as workOrdersApi from "@/features/work-orders/api/work-orders-api";
import {
    EmployeeWorkOrderList,
    WorkOrderListContent,
} from "@/features/work-orders/components/work-order-list";
import { useStaffGuard } from "@/features/vehicles/hooks/use-staff-guard";
import type {
    WorkOrderStatus,
    WorkOrderSummary,
} from "@/features/work-orders/types/work-order.types";

const summary: WorkOrderSummary = {
    id: "order-1",
    appointmentId: "appointment-1",
    customerId: "customer-1",
    customerName: "Marie Dupont",
    customerVehicleId: "vehicle-1",
    vehicleLabel: "Peugeot 308 — 1-ABC-234",
    assignedEmployeeId: null,
    assignedEmployeeName: null,
    status: "DRAFT",
    openedAt: "2026-07-26T08:00:00Z",
    updatedAt: "2026-07-26T09:00:00Z",
};

function page(
    content: WorkOrderSummary[],
    overrides: Partial<{
        page: number;
        totalElements: number;
        totalPages: number;
        first: boolean;
        last: boolean;
    }> = {}
) {
    return {
        content,
        page: overrides.page ?? 0,
        size: 20,
        totalElements: overrides.totalElements ?? content.length,
        totalPages: overrides.totalPages ?? (content.length ? 1 : 0),
        first: overrides.first ?? true,
        last: overrides.last ?? true,
    };
}

beforeEach(() => {
    pushMock.mockReset();
    replaceMock.mockReset();
    searchKey = "";
    vi.stubGlobal("scrollTo", vi.fn());
    vi.mocked(useStaffGuard).mockReturnValue({
        user: {
            id: "staff-1",
            firstName: "Alex",
            lastName: "Atelier",
            email: "staff@example.be",
            role: "ROLE_EMPLOYEE",
        },
        loading: false,
        authorized: true,
    });
    vi.mocked(workOrdersApi.getWorkOrders).mockReset();
});

describe("WorkOrderList", () => {
    it("affiche le chargement initial", () => {
        vi.mocked(workOrdersApi.getWorkOrders).mockReturnValue(
            new Promise(() => {})
        );

        render(<WorkOrderListContent searchKey="" />);

        expect(
            screen.getByText("Chargement des ordres de réparation...")
        ).toBeInTheDocument();
    });

    it("affiche une liste et le lien vers le détail", async () => {
        vi.mocked(workOrdersApi.getWorkOrders).mockResolvedValue(
            page([summary])
        );

        render(<WorkOrderListContent searchKey="" />);

        expect(await screen.findByText("Marie Dupont")).toBeInTheDocument();
        expect(
            screen.getByText("Peugeot 308 — 1-ABC-234")
        ).toBeInTheDocument();
        expect(screen.getByText("Non assigné")).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: "Ouvrir le dossier" })
        ).toHaveAttribute("href", "/employee/work-orders/order-1");
    });

    it("affiche le badge de chacun des statuts", async () => {
        const statuses: WorkOrderStatus[] = [
            "DRAFT",
            "PLANNED",
            "IN_PROGRESS",
            "WAITING_FOR_PARTS",
            "READY",
            "DELIVERED",
            "CANCELLED",
        ];
        vi.mocked(workOrdersApi.getWorkOrders).mockResolvedValue(
            page(
                statuses.map((status, index) => ({
                    ...summary,
                    id: `order-${index}`,
                    status,
                }))
            )
        );

        render(<WorkOrderListContent searchKey="" />);

        for (const label of [
            "Brouillon",
            "Planifié",
            "En cours",
            "En attente de pièces",
            "Prêt",
            "Livré",
            "Annulé",
        ]) {
            expect(
                (await screen.findAllByText(label)).length
            ).toBeGreaterThan(0);
        }
    });

    it("affiche l’état vide sans filtre", async () => {
        vi.mocked(workOrdersApi.getWorkOrders).mockResolvedValue(page([]));

        render(<WorkOrderListContent searchKey="" />);

        expect(
            await screen.findByText(
                "Aucun ordre de réparation n’a encore été créé."
            )
        ).toBeInTheDocument();
    });

    it("affiche l’état vide contextualisé avec un filtre", async () => {
        vi.mocked(workOrdersApi.getWorkOrders).mockResolvedValue(page([]));

        render(
            <WorkOrderListContent searchKey="status=READY&page=0" />
        );

        expect(
            await screen.findByText(
                "Aucun ordre de réparation ne correspond aux filtres sélectionnés."
            )
        ).toBeInTheDocument();
    });

    it("applique les filtres statut et date en remettant la page à zéro", async () => {
        vi.mocked(workOrdersApi.getWorkOrders).mockResolvedValue(page([]));
        const user = userEvent.setup();

        render(<WorkOrderListContent searchKey="page=3" />);
        await user.selectOptions(
            screen.getByLabelText("Statut"),
            "IN_PROGRESS"
        );
        await user.type(
            screen.getByLabelText("Date d’ouverture"),
            "2026-07-26"
        );
        await user.click(
            screen.getByRole("button", {
                name: "Appliquer les filtres",
            })
        );

        expect(pushMock).toHaveBeenCalledWith(
            "/employee/work-orders?status=IN_PROGRESS&date=2026-07-26&page=0"
        );
    });

    it("réinitialise les filtres", async () => {
        vi.mocked(workOrdersApi.getWorkOrders).mockResolvedValue(page([]));
        const user = userEvent.setup();

        render(
            <WorkOrderListContent searchKey="status=READY&date=2026-07-26" />
        );
        await user.click(
            screen.getByRole("button", { name: "Réinitialiser" })
        );

        expect(pushMock).toHaveBeenCalledWith("/employee/work-orders");
    });

    it("navigue vers les pages précédente et suivante", async () => {
        vi.mocked(workOrdersApi.getWorkOrders).mockResolvedValue(
            page([summary], {
                page: 1,
                totalElements: 60,
                totalPages: 3,
                first: false,
                last: false,
            })
        );
        const user = userEvent.setup();

        render(
            <WorkOrderListContent searchKey="status=READY&page=1" />
        );
        await screen.findByText("Marie Dupont");
        await user.click(
            screen.getByRole("button", { name: "Précédent" })
        );
        await user.click(
            screen.getByRole("button", { name: "Suivant" })
        );

        expect(pushMock).toHaveBeenNthCalledWith(
            1,
            "/employee/work-orders?status=READY&page=0"
        );
        expect(pushMock).toHaveBeenNthCalledWith(
            2,
            "/employee/work-orders?status=READY&page=2"
        );
    });

    it("affiche une erreur générique sans détail technique", async () => {
        vi.mocked(workOrdersApi.getWorkOrders).mockRejectedValue(
            new Error("SQL table work_orders internal")
        );

        render(<WorkOrderListContent searchKey="" />);

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Impossible de charger les ordres de réparation."
        );
        expect(screen.queryByText(/SQL|work_orders/)).not.toBeInTheDocument();
    });

    it("ne charge rien quand le garde refuse le rôle client", async () => {
        vi.mocked(useStaffGuard).mockReturnValue({
            user: {
                id: "customer-1",
                firstName: "Lina",
                lastName: "Client",
                email: "lina@example.be",
                role: "ROLE_CUSTOMER",
            },
            loading: false,
            authorized: false,
        });

        render(<EmployeeWorkOrderList />);

        await waitFor(() =>
            expect(workOrdersApi.getWorkOrders).not.toHaveBeenCalled()
        );
    });
});
