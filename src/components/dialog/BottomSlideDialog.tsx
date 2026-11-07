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
            <div class="flex items-center justify-between py-4 pl-6 pr-4 sm:pl-8">
                <h3 class="m-0 font-[Nunito] text-[15px] sm:text-base font-bold text-slate-800">{props.title}</h3>
                <button aria-label="Fermer" class="m-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-base text-slate-500 duration-150 hover:bg-slate-100 hover:text-slate-800" onClick={props.onClose}> ✕ </button>
            </div>
            <div class="mt-4 ">
                {props.children}
            </div>
        </div>
    );
}


