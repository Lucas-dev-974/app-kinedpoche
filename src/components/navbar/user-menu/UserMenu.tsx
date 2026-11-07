import { createSignal } from "solid-js";
import { UserMenuDialog } from "./UserMenuDialog";

export function UserMenu() {
  const [isMenuDialogOpen, setIsMenuDialogOpen] = createSignal<boolean>(false);
  const [menuRef, setMenuRef] = createSignal<HTMLDivElement>();

  return (
    <div ref={setMenuRef} class="relative">
      {/* Burger raffiné (template V3) : lignes resserrées, caps arrondis,
          3e ligne raccourcie = signature visuelle. Hitbox 40px. */}
      <button
        onClick={() => setIsMenuDialogOpen(!isMenuDialogOpen())}
        class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[12px] border-none bg-transparent transition duration-150 hover:bg-white/[0.16]"
        aria-label="Menu utilisateur"
        aria-expanded={isMenuDialogOpen()}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="14" y2="17" />
        </svg>
      </button>
      <UserMenuDialog
        openDialog={isMenuDialogOpen()}
        onClose={() => setIsMenuDialogOpen(false)}
        menuRootRef={menuRef}
      />
    </div>
  )
}
