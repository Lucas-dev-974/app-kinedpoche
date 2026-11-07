import { JSXElement } from "solid-js";

interface ButtonProps {
  text: string;
  icon?: JSXElement;
  onClick: () => void;
  class?: string;
  size?: "xs" | "small" | "medium" | "large";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  bgGradientStyle?: "right" | "left";
  preventDefault?: boolean;
  isDanger?: boolean;
}

export function Button(props: ButtonProps) {
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

  let preventDefault = props.preventDefault ?? true;

  const dangerStyle = "background: linear-gradient(190deg,rgba(220, 38, 38, 1) 0%, rgba(220, 38, 38, 1)  100%);";
  const gradientStyle = props.bgGradientStyle == "right"
    ? "background: linear-gradient(90deg,rgba(9, 151, 115, 1) 0%, rgba(67, 182, 146, 1) 100%);"
    : "background: linear-gradient(270deg,rgba(9, 151, 115, 1) 0%, rgba(67, 182, 146, 1) 100%);";

  const style = () => props.isDanger ? dangerStyle : gradientStyle

  return (
    <button
      class={
        classe +
        " font-[Nunito] text-sm md:text-base px-4 py-2 rounded-lg cursor-pointer text-white duration-700 hover:shadow-lg border-none " +
        (props.class ?? " ")
      }
      onClick={(e) => {
        if (preventDefault) {
          e.preventDefault();
        }
        props.onClick()
      }}
      disabled={props.disabled}
      type={props.type ?? "button"}
      style={style()}
    >

      {(props.icon ? props.icon : null)}
      <span class={props.icon ? "ml-2" : ""}>{props.text}</span>
    </button>
  );
}
