import { Show } from "solid-js";

interface FitFieldsWithUserDataProps {
  onFill: () => void;
  onClear: () => void;
  isFilled: boolean;
  filledText?: string;
  clearedText?: string;
}

// Chip d'aide, alignée à droite de la section : état "remplir" en vert
// discret, état "retirer" (destructif du contenu) en rouge doux.
export function FitFieldsWithUserData(props: FitFieldsWithUserDataProps) {
  const handleClick = () => {
    if (props.isFilled) {
      props.onClear();
    } else {
      props.onFill();
    }
  };

  return (
    <Show
      when={props.isFilled}
      fallback={
        <button
          type="button"
          onClick={handleClick}
          class="m-0 flex cursor-pointer select-none items-center gap-1.5 rounded-full border border-[#099773]/50 bg-[#099773]/[0.07] px-3 py-1.5 font-[Nunito] text-[12px] font-bold text-[#099773] duration-150 hover:bg-[#099773]/[0.14]"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
          {props.filledText || "Remplir avec mes informations"}
        </button>
      }
    >
      <button
        type="button"
        onClick={handleClick}
        class="m-0 flex cursor-pointer select-none items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 font-[Nunito] text-[12px] font-bold text-red-700 duration-150 hover:bg-red-100"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14" />
        </svg>
        {props.clearedText || "Retirer mes informations"}
      </button>
    </Show>
  );
}
