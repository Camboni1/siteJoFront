import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Démonte l'arbre React et vide le DOM entre chaque test pour éviter
// les fuites d'état d'un test à l'autre.
afterEach(() => {
    cleanup();
});
