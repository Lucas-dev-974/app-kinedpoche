import { createEffect, createSignal } from "solid-js";

export type FillMode = "replaced" | "substitute" | null;

const [fillMode, setFillMode] = createSignal<FillMode>(null);

/**
 * Déclenche un remplissage d'un bloc et informe l'autre bloc de se vider.
 */
export function triggerFill(mode: Exclude<FillMode, null>) {
    setFillMode(mode);
}

/**
 * Hook utilitaire : exécute clearFn quand l'autre bloc déclenche son remplissage.
 * Exemple : useFillMode("substitute", clearReplaced) dans ReplacedFields.
 */
export function useFillMode(
    listenTo: Exclude<FillMode, null>,
    clearFn: () => void
): void {
    createEffect(() => {
        if (fillMode() === listenTo) {
            clearFn();
            setFillMode(null);
        }
    });
}

export { fillMode, setFillMode };

