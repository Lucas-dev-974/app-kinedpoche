import { VsChromeClose } from "solid-icons/vs";
import { Show } from "solid-js";

interface DialgoHeaderProps {
    title: string;
    onClose: () => void;
    /** Optionnel : ligne secondaire sous le titre (contexte du dialog). */
    subtitle?: string;
}

export function DialgoHeader(props: DialgoHeaderProps) {
    // rounded-t-lg : colle au container par défaut (rounded-lg) ; si le
    // container custom porte overflow-hidden + coins plus grands, le clipping
    // parent prend le dessus.
    return <div class="flex flex-none items-center justify-between rounded-t-lg p-4 pl-5 text-white"
        style="background: linear-gradient(190deg,rgba(9, 151, 115, 1) 0%, rgba(67, 182, 146, 1) 100%);">
        <div class="min-w-0">
            <h3 class="text-base sm:text-lg md:text-xl font-bold m-0 font-[Nunito] truncate pr-2">{props.title}</h3>
            <Show when={props.subtitle}>
                <p class="m-0 mt-0.5 truncate pr-2 font-[Nunito] text-[11.5px] sm:text-xs font-medium text-white/80">{props.subtitle}</p>
            </Show>
        </div>

        <button aria-label="Fermer" class="m-0 flex h-9 w-9 flex-none cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-white duration-150 hover:bg-white/15" onClick={props.onClose}>
            <VsChromeClose size={18} />
        </button>
    </div>
}
