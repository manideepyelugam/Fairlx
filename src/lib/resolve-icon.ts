/**
 * Shared utility for resolving react-icons by name.
 * 
 * IMPORTANT: This replaces `import * as Icons from "react-icons/ai"` (×10 packages)
 * that was adding ~2.5MB to every page that used it. Instead, we lazy-load
 * only the specific icon package needed at runtime.
 * 
 * Uses explicit import() calls per package to avoid webpack
 * "Critical dependency: the request of a dependency is an expression" warnings.
 */

import React from "react";
import { CircleIcon } from "lucide-react";

// Cache loaded icon modules to avoid re-importing
const moduleCache = new Map<string, Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>>();

// Supported prefixes
const KNOWN_PREFIXES = new Set(["Ai", "Bi", "Bs", "Fa", "Fi", "Hi", "Io", "Md", "Ri", "Tb"]);

/**
 * Get the package prefix from an icon name.
 * e.g., "AiFillHome" → "Ai", "FaBeer" → "Fa", "MdHome" → "Md"
 */
function getPrefix(iconName: string): string | null {
    const two = iconName.slice(0, 2);
    if (KNOWN_PREFIXES.has(two)) return two;
    return null;
}

/**
 * Load a single icon package by prefix.
 * Uses explicit import() calls so webpack can statically analyze them.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadPackage(prefix: string): Promise<Record<string, any>> {
    switch (prefix) {
        case "Ai": return import("react-icons/ai");
        case "Bi": return import("react-icons/bi");
        case "Bs": return import("react-icons/bs");
        case "Fa": return import("react-icons/fa");
        case "Fi": return import("react-icons/fi");
        case "Hi": return import("react-icons/hi");
        case "Io": return import("react-icons/io5");
        case "Md": return import("react-icons/md");
        case "Ri": return import("react-icons/ri");
        case "Tb": return import("react-icons/tb");
        default: return {};
    }
}

/**
 * Synchronously resolve an icon component from the cache.
 * Returns CircleIcon as fallback if not cached yet.
 */
export function resolveIconSync(
    iconName: string | undefined | null
): React.ComponentType<{ className?: string; style?: React.CSSProperties }> {
    if (!iconName) return CircleIcon;

    const prefix = getPrefix(iconName);
    if (!prefix) return CircleIcon;

    const cached = moduleCache.get(prefix);
    if (cached && cached[iconName]) {
        return cached[iconName];
    }

    return CircleIcon;
}

/**
 * Preload icon modules for a set of icon names.
 * Call this once when you have a list of icons to display.
 */
export async function preloadIcons(iconNames: string[]): Promise<void> {
    const prefixesToLoad = new Set<string>();

    for (const name of iconNames) {
        if (!name) continue;
        const prefix = getPrefix(name);
        if (prefix && !moduleCache.has(prefix)) {
            prefixesToLoad.add(prefix);
        }
    }

    await Promise.all(
        Array.from(prefixesToLoad).map(async (prefix) => {
            try {
                const mod = await loadPackage(prefix);
                moduleCache.set(prefix, mod as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>);
            } catch {
                // Silently fail — icon will show fallback
            }
        })
    );
}

/**
 * React hook that resolves an icon by name with lazy loading.
 * Returns a loading-aware icon component.
 */
export function useResolvedIcon(
    iconName: string | undefined | null
): React.ComponentType<{ className?: string; style?: React.CSSProperties }> {
    const [Icon, setIcon] = React.useState<React.ComponentType<{ className?: string; style?: React.CSSProperties }>>(
        () => resolveIconSync(iconName)
    );

    React.useEffect(() => {
        if (!iconName) return;

        const prefix = getPrefix(iconName);
        if (!prefix) return;

        // If already cached, use it
        const cached = moduleCache.get(prefix);
        if (cached && cached[iconName]) {
            setIcon(() => cached[iconName]);
            return;
        }

        // Load the module
        loadPackage(prefix).then((mod) => {
            moduleCache.set(prefix, mod as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>);
            if (mod[iconName]) {
                setIcon(() => mod[iconName]);
            }
        }).catch(() => {
            // Keep fallback
        });
    }, [iconName]);

    return Icon;
}
