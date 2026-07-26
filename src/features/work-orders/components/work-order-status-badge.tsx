import {
    WORK_ORDER_STATUS_BADGE_CLASSES,
    WORK_ORDER_STATUS_LABELS,
} from "@/features/work-orders/lib/work-order";
import type { WorkOrderStatus } from "@/features/work-orders/types/work-order.types";

export function WorkOrderStatusBadge({
    status,
}: {
    status: WorkOrderStatus;
}) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${WORK_ORDER_STATUS_BADGE_CLASSES[status]}`}
        >
            <span
                className="h-1.5 w-1.5 rounded-full bg-current"
                aria-hidden
            />
            {WORK_ORDER_STATUS_LABELS[status]}
        </span>
    );
}
