import { describe, expect, it } from "vitest";
import { localIsoDate } from "@/lib/date";

describe("localIsoDate", () => {
    it("utilise les composantes locales sans conversion UTC", () => {
        const localDate = new Date(2026, 6, 26, 0, 15);

        expect(localIsoDate(localDate)).toBe("2026-07-26");
    });
});
