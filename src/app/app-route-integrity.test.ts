import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_ROOT = path.join(process.cwd(), "src");
const APP_ROOT = path.join(SOURCE_ROOT, "app");

function filesBelow(root: string, predicate: (file: string) => boolean) {
    const files: string[] = [];

    function visit(directory: string) {
        for (const entry of fs.readdirSync(directory, {
            withFileTypes: true,
        })) {
            const absolutePath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                visit(absolutePath);
            } else if (predicate(absolutePath)) {
                files.push(absolutePath);
            }
        }
    }

    visit(root);
    return files;
}

function routeFromPage(pageFile: string) {
    const relative = path.relative(APP_ROOT, pageFile);
    const segments = relative
        .split(path.sep)
        .slice(0, -1)
        .filter((segment) => !segment.startsWith("("));

    return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

function routePattern(route: string) {
    if (route === "/") {
        return /^\/$/;
    }

    const expression = route
        .split("/")
        .map((segment) => {
            if (!segment) {
                return "";
            }
            if (segment.startsWith("[") && segment.endsWith("]")) {
                return "[^/]+";
            }
            return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        })
        .join("/");

    return new RegExp(`^${expression}$`);
}

function normalizedPath(target: string) {
    const [withoutHash] = target.split("#", 1);
    const [withoutQuery] = withoutHash.split("?", 1);
    return withoutQuery || "/";
}

function dynamicTarget(template: string) {
    if (template.startsWith("${pathname}")) {
        return null;
    }

    return template.replace(/\$\{[^}]+\}/g, "__dynamic__");
}

function collectTargets(source: string) {
    const targets: string[] = [];
    const quotedPatterns = [
        /\b(?:href|backHref)\s*(?:=|:)\s*["'](\/[^"']*)["']/g,
        /\brouter\.(?:push|replace)\(\s*["'](\/[^"']*)["']/g,
    ];
    const templatePatterns = [
        /\b(?:href|backHref)\s*(?:=|:)\s*\{?\s*`([^`]+)`/g,
        /\brouter\.(?:push|replace)\(\s*`([^`]+)`/g,
    ];

    for (const pattern of quotedPatterns) {
        for (const match of source.matchAll(pattern)) {
            targets.push(match[1]);
        }
    }
    for (const pattern of templatePatterns) {
        for (const match of source.matchAll(pattern)) {
            const target = dynamicTarget(match[1]);
            if (target?.startsWith("/")) {
                targets.push(target);
            }
        }
    }

    return targets;
}

describe("inventaire des routes et liens internes", () => {
    const pageFiles = filesBelow(
        APP_ROOT,
        (file) => path.basename(file) === "page.tsx"
    );
    const routes = pageFiles.map(routeFromPage).sort();
    const patterns = routes.map(routePattern);
    const sourceFiles = filesBelow(
        SOURCE_ROOT,
        (file) =>
            /\.(ts|tsx)$/.test(file) &&
            !/\.(test|spec)\.(ts|tsx)$/.test(file)
    );
    const sources = sourceFiles.map((file) => fs.readFileSync(file, "utf8"));
    const combinedSource = sources.join("\n");

    it("prend les pages App Router présentes comme source de vérité", () => {
        expect(routes).toHaveLength(34);
        expect(routes).toContain("/");
        expect(routes).toContain("/dashboard/appointments/new");
        expect(routes).toContain("/employee/invoices/[id]");
        expect(routes).toContain("/vehicles/[id]");
    });

    it("ne contient aucun lien factice et chaque destination rejoint une route", () => {
        expect(combinedSource).not.toMatch(
            /\bhref\s*=\s*(?:\{\s*)?["']#(?:["'])/
        );

        const targets = sources.flatMap(collectTargets);
        const invalidTargets = targets.filter((target) => {
            const targetPath = normalizedPath(target);
            return !patterns.some((pattern) => pattern.test(targetPath));
        });

        expect(invalidTargets).toEqual([]);
    });

    it("conserve des ancres réelles pour les liens de navigation publique", () => {
        const anchors = sources
            .flatMap((source) =>
                Array.from(
                    source.matchAll(/\bid\s*=\s*["']([^"']+)["']/g),
                    (match) => match[1]
                )
            );
        const linkedAnchors = sources
            .flatMap(collectTargets)
            .map((target) => target.split("#")[1])
            .filter((anchor): anchor is string => Boolean(anchor));

        expect(linkedAnchors.length).toBeGreaterThan(0);
        for (const anchor of linkedAnchors) {
            expect(anchors).toContain(anchor);
        }
    });
});
