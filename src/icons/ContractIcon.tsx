interface ContractIconProps {
    /** Taille en px (défaut 24). Le glyphe est basé sur un viewBox 24. */
    size?: number;
    class?: string;
}

// Icône « contrat » en trait (outline) : feuille, lignes de texte et paraphe.
// Cohérente avec le langage outline du reste de l'app (HiOutline*, Fi*) —
// remplace le glyphe rempli "document médical" (file-medical) qui disait
// dossier de santé au lieu de contrat de collaboration.
export function ContractIcon(props: ContractIconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            width={props.size ? props.size : 24}
            height={props.size ? props.size : 24}
            class={props.class}
            aria-hidden="true"
        >
            {/* Feuille avec coin plié */}
            <path d="M6 2.75h7.5L19 8.25v10.5a2.5 2.5 0 0 1-2.5 2.5h-10.5A2.5 2.5 0 0 1 3.5 18.75V5.25A2.5 2.5 0 0 1 6 2.75Z" />
            <path d="M13.25 3v5h5.5" />
            {/* Lignes de texte */}
            <path d="M7.25 11.5h6.5" />
            <path d="M7.25 14.5h6.5" />
            {/* Paraphe (signature) */}
            <path d="M7.25 17.75c.9-1.5 2.2-1.9 3-.9.7.9 1.9.7 3-.7" />
        </svg>
    );
}
