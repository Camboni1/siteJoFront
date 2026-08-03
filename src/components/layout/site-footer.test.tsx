import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteFooter } from "@/components/layout/site-footer";

describe("SiteFooter", () => {
    it("relie les destinations internes et les contacts officiels", () => {
        render(<SiteFooter />);

        expect(
            screen.getByRole("link", { name: "CamboGarage — accueil" })
        ).toHaveAttribute("href", "/");
        expect(
            screen.getByRole("link", { name: "Prendre rendez-vous" })
        ).toHaveAttribute("href", "/dashboard/appointments/new");
        expect(
            screen.getByRole("link", { name: "+32 81 12 34 56" })
        ).toHaveAttribute("href", "tel:+3281123456");

        const whatsapp = screen.getByRole("link", {
            name: "Contacter CamboGarage sur WhatsApp — nouvel onglet",
        });
        expect(whatsapp).toHaveAttribute(
            "href",
            expect.stringMatching(
                /^https:\/\/wa\.me\/32475123456\?text=/
            )
        );
        expect(whatsapp).toHaveAttribute("target", "_blank");
        expect(whatsapp).toHaveAttribute(
            "rel",
            expect.stringContaining("noopener")
        );
    });
});
