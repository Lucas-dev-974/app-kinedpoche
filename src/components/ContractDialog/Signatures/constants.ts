export const SIGNATURE_CONFIG = {
    // Encre neutre (ardoise foncé) : signature type document officiel ;
    // le bleu Google d'origine était hors charte.
    PEN_COLOR: "rgb(30, 41, 59)",
    CANVAS_CLASSES: {
        DISPLAY: "bg-slate-300 w-full mx-auto",
        EDITOR: "border border-slate-300 rounded-[10px] w-full h-[40vh] mx-auto",
    },
    CONTAINER_CLASSES: {
        CANVAS: "relative group w-full overflow-hidden rounded-[10px] ring-1 ring-slate-200",
        BUTTON: "absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/40 text-white font-[Nunito] text-[13px] font-bold",
    },
} as const;

export const SIGNATURE_LABELS = {
    REPLACED: "remplacé",
    SUBSTITUTE: "remplaçant",
    EDIT: "Éditer",
    CLEAR: "Effacer",
    CANCEL: "Annuler",
    SAVE: "Enregistrer",
} as const;

export const SIGNATURE_TITLES = {
    ADD_REPLACED: "Ajouter la signature du remplacé",
    ADD_SUBSTITUTE: "Ajouter la signature du remplaçant",
} as const;
