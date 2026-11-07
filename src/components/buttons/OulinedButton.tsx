import { JSXElement } from "solid-js";

interface OutlinedButtonProps {
    text: string;
    icon?: JSXElement;
    onClick: () => void;
    class?: string;
    size?: "xs" | "small" | "medium" | "large";
    subText?: string;
    type?: "button" | "submit" | "reset";
}

export function OutlinedButton(props: OutlinedButtonProps) {
    let classe = ""

    if (props.size == "xs") {
        classe = "!text-xs  !px-4   !py-2"
    } else if (props.size == "small") {
        classe = "!text-sm  !px-3 !py-1"
    } else if (props.size == "medium") {
        classe = "!text-base  !px-4 !py-2"
    } else if (props.size == "large") {
        classe = "!text-lg  !px-5 !py-3"
    }

    return (
        <button
            class={
                classe +
                "flex flex-col items-center justify-center" +
                " font-[Nunito] text-sm md:text-base px-4 py-2 rounded-lg cursor-pointer duration-200 " +
                " bg-transparent border border-solid border-[#099773] text-[#099773] shadow-none hover:shadow-none " +
                (props.class ?? " ")
            }
            onClick={props.onClick}
            type={props.type ?? "button"}
        >
            <div class="flex items-center gap-2">
                {props.icon ? props.icon : null}
                <p class="m-0">{props.text}</p>
            </div>
            {props.subText ? <p class="text-xs text-gray-500 m-0">{props.subText}</p> : null}
        </button>
    );
}
