import { BottomMenuPageRouter } from "./bottom-menu-page/BottomMenuPageRouter";
import { createSignal } from "solid-js";
import { Overlay } from "../../dialog/Overlay";

export const [isBottomMenuVisible, setIsBottomMenuVisible] = createSignal(false);
export const toggleDialog = () => setIsBottomMenuVisible(!isBottomMenuVisible());

export const [bottomMenuPage, setBottomMenuPage] = createSignal("");

export enum BottomMenuPageEnum {
  account = "Compte",
  contracts = "Contrats",
  none = "none",
}

export const setBottomMenuPageValue = (value: BottomMenuPageEnum) => {
  setBottomMenuPage(value);
  setIsBottomMenuVisible(true);
};

export function BottomMenuDialog() {
  return (
    <>
      <Overlay show={isBottomMenuVisible()} onClick={() => setIsBottomMenuVisible(false)} />
      {/* Feuille bas : carte arrondie scrollable (mobile pleine largeur, desktop
          carte centrée 560px). Slide 300ms (l'ancien 1000ms trainait) ; close
          via croix ou fond. */}
      <div
        class="fixed bottom-0 left-1/2 z-[200] flex h-[85vh] max-h-[600px] w-full -translate-x-1/2 flex-col overflow-hidden rounded-t-2xl bg-white box-border shadow-[0_-12px_40px_rgba(15,23,42,0.18)] transform transition-transform duration-300 sm:w-[560px]"
        classList={{
          "translate-y-full": !isBottomMenuVisible(),
          "translate-y-0": isBottomMenuVisible(),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <BottomMenuPageRouter />
      </div>
    </>
  );
}
