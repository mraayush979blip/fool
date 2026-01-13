"use client";

import { useEffect } from "react";

export default function VersionCheck() {
    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            // Check if the error is related to loading a chunk
            // Different browsers might have different error messages
            const isChunkError =
                event.message?.toLowerCase().includes("loading chunk") ||
                event.message?.toLowerCase().includes("loading css chunk") ||
                event.message?.toLowerCase().includes("unexpected token '<'") || // Often triggered when JS file is replaced by 404 HTML
                (event.target as any)?.tagName === "SCRIPT" ||
                (event.target as any)?.tagName === "LINK";

            if (isChunkError) {
                console.log("🔄 Version mismatch detected! Reloading to fetch fresh assets...");

                // Use a small timeout to prevent reload loops if it's a persistent error not fixed by reload
                const lastReload = sessionStorage.getItem("last_version_reload");
                const now = Date.now();

                if (!lastReload || now - parseInt(lastReload) > 5000) {
                    sessionStorage.setItem("last_version_reload", now.toString());
                    // Force a hard reload from server, ignoring cache
                    window.location.reload();
                }
            }
        };

        window.addEventListener("error", handleError, true); // Capture phase to catch resource errors

        return () => {
            window.removeEventListener("error", handleError, true);
        };
    }, []);

    return null; // Headless component
}
