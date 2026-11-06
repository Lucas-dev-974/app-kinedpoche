import { JSX } from "solid-js";

interface BottomSlideDialogProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: JSX.Element;
}

export function BottomSlideDialog(props: BottomSlideDialogProps) {
    return (
        <div
            class="fixed bottom-0  w-[100vw] bg-white rounded-t-xl shadow-xl transform transition-transform duration-500 pointer-events-auto z-[200]"
            classList={{
                "translate-y-full": !props.open,
                "translate-y-0": props.open,
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <div class="flex items-center justify-between px-4 sm:px-8">
                <h3 class="text-base sm:text-lg font-semibold">{props.title}</h3>
                <button aria-label="Fermer" class="p-1 bg-transparent border-none text-2xl text-red-500" onClick={props.onClose}> ✕ </button>
            </div>
            <div class="mt-4 ">
                {props.children}
            </div>
        </div>
    );
}


