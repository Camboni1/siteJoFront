import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CamboGarageLogo } from "@/components/ui/brand";

describe("CamboGarageLogo", () => {
    it("rend le vrai fichier PNG avec un nom et des dimensions accessibles", () => {
        render(<CamboGarageLogo />);

        const logo = screen.getByRole("img", { name: "Cambo Garage" });
        expect(logo).toHaveAttribute(
            "src",
            expect.stringContaining("url=%2Flogo.png")
        );
        expect(logo).toHaveAttribute("width", "1672");
        expect(logo).toHaveAttribute("height", "941");
        expect(logo).toHaveClass("h-16", "w-auto");
        expect(logo).toHaveAttribute("loading", "lazy");
        expect(screen.queryByText("CG")).not.toBeInTheDocument();
        expect(screen.queryByText("Atelier automobile")).not.toBeInTheDocument();
    });
});
