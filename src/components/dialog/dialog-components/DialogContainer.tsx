import { children, JSX } from "solid-js";

interface DialogContainerProps {
    children: JSX.Element;
    /** Classes customisées : REMPLACENT les classes par défaut quand fournies. */
    className?: string;
}

export function DialogContainer(props: DialogContainerProps) {
    const child = children(() => props.children);
    return (
        <div onClick={(e) => e.stopPropagation()} class={props.className ?? "fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-[200]  w-[90vw] sm:w-[70vw] md:w-[60vw] lg:w-[50vw] xl:w-[40vw] bg-slate-200 rounded-lg"}>
            {child()}
        </div>
    );
}