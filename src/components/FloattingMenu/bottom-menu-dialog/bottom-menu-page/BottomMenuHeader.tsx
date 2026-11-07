import { VsChromeClose } from "solid-icons/vs";
import { setIsBottomMenuVisible } from "../BottomMenuDialog";

// En-tête de la feuille : poignée (grabber) + titre + croix cercle hover.
// Les coins arrondis viennent du clip de la feuille (overflow-hidden).
export function BottomMenuHeader() {
    return (
        <div class="flex-none"
            style={{ "background": "linear-gradient(173deg,rgba(9, 151, 115, 1) 0%, rgba(67, 182, 146, 1) 100%)" }}>
            <div class="mx-auto mt-2.5 h-1 w-10 rounded-full bg-white/40" />
            <div class="flex items-center justify-between py-2.5 pl-6 pr-4">
                <p class="m-0 font-[Nunito] text-[16px] sm:text-[17px] font-bold text-white">Documents</p>
                <button
                    aria-label="Fermer"
                    onClick={() => setIsBottomMenuVisible(false)}
                    class="m-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-white duration-150 hover:bg-white/15"
                >
                    <VsChromeClose size={16} />
                </button>
            </div>
        </div>
    );
}
