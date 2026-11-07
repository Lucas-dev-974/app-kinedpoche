import { FloatingMenuItems } from "./FloatingMenuItems";
import { BottomMenuDialog } from "../bottom-menu-dialog/BottomMenuDialog";


export function FloatingMenu() {
  return (
    // Note (audit propreté 07/11) : l'ancienne condition `onPage()` du
    // RouterTypes était morte — setPage n'était jamais appelé ET FloatingMenu
    // n'est monté que dans PageWrapper (jamais sur /login ni /register).
    <div class="fixed bottom-0 w-full flex justify-center overflow-visible z-[200]">
      <div class="w-full text-white shadow-2xl px-4 sm:px-5 py-2 flex gap-6 sm:gap-10 justify-center"
        style={{ "background": "linear-gradient(360deg,rgba(9, 151, 115, 1) 0%, rgba(67, 182, 146, 1) 100%)" }}>
        <FloatingMenuItems />
      </div>
      <BottomMenuDialog />
    </div>
  );
}
