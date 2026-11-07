import { HiOutlinePlus } from "solid-icons/hi";
import { DIALOG_NAMES, openDialogTool } from "../../components/dialog/DialogWrapper";

// CTA persistant (téléphone-first) : flotte au-dessus du FloatingMenu
// (bottom-24 = 96px, vérifié > hauteur du menu) et sous les dialogs (z-[150] < z-[200]).
export function StickyCta() {
  return (
    <div class="pointer-events-none fixed inset-x-0 bottom-24 z-[150] flex justify-center px-3">
      <button
        onClick={() => openDialogTool(DIALOG_NAMES.editContract)}
        class="pointer-events-auto flex w-full max-w-[398px] cursor-pointer items-center justify-center gap-2 rounded-[13px] border-none bg-[#099773] py-[15px] font-[Nunito] text-[15.5px] font-bold text-white duration-200 hover:-translate-y-px"
        style={{ "box-shadow": "0 10px 26px rgba(9,151,115,0.4)" }}
      >
        <HiOutlinePlus size={17} />
        Créer un contrat
      </button>
    </div>
  );
}
