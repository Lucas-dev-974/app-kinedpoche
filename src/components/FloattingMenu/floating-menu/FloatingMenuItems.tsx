import { setIsBottomMenuVisible, setBottomMenuPageValue, BottomMenuPageEnum, isBottomMenuVisible, bottomMenuPage } from "../bottom-menu-dialog/BottomMenuDialog";
import { ContractIcon } from "../../../icons/ContractIcon";

// Barre flottante = 1 action pour l'instant (« Contrats »). Le libellé est en
// flux (l'ancien `absolute -bottom-4` débordait sous la barre). États : chip
// hover discret (aligné sur le burger de la navbar) + état actif quand la
// feuille est déjà ouverte sur cette page (re-clic = repli).
const menuItems = [
  {
    label: BottomMenuPageEnum.contracts,
    action: (isCurrent: boolean) => (isCurrent ? setIsBottomMenuVisible(false) : setBottomMenuPageValue(BottomMenuPageEnum.contracts)),
  },
];

export function FloatingMenuItems() {
  const isCurrent = () => isBottomMenuVisible() && bottomMenuPage() === BottomMenuPageEnum.contracts;
  return menuItems.map((item) => (
    <button
      onClick={() => item.action(isCurrent())}
      aria-label={`Ouvrir ${item.label}`}
      aria-expanded={isCurrent()}
      class="m-0 flex cursor-pointer select-none flex-col items-center gap-1 rounded-[12px] border-none bg-transparent px-5 py-1.5 text-white duration-150 hover:bg-white/[0.16]"
      classList={{ "bg-white/[0.16]": isCurrent() }}
    >
      <ContractIcon size={26} />
      <p class="m-0 font-[Nunito] text-[11.5px] font-bold text-white">{item.label}</p>
    </button>
  ));
}
