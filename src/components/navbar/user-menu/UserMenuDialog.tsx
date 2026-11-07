import { HiOutlineDocumentText, HiOutlineFlag } from "solid-icons/hi";
import { ReportBugDialog, setReportBugOpen } from "../../dialog/report-bug/ReportBugDialog";
import { DIALOG_NAMES, openDialogTool } from "../../dialog/DialogWrapper";
import { authService } from "../../../services/auth.service";
import { Accessor, JSXElement, createRenderEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import storeService from "../../../utils/store.service";

interface UserMenuDialogProps {
  openDialog: boolean;
  onClose: () => void;
  menuRootRef: Accessor<HTMLElement | undefined>;
}

function MenuItem(props: { icon: JSXElement; text: string; onClick: () => void }) {
  return (
    <button
      onClick={props.onClick}
      class="m-0 flex w-full cursor-pointer items-center gap-3 rounded-[10px] border-none bg-transparent px-2.5 py-[10.5px] text-left font-[Nunito] text-[13.5px] font-bold text-white duration-150 hover:bg-white/[0.16]"
    >
      <span class="flex flex-none items-center text-white">{props.icon}</span>
      {props.text}
      <span class="ml-auto text-[15px] font-normal text-white/70">›</span>
    </button>
  );
}

// "Claire Fontan" → "CF" (2 premières initiales, pour l'avatar du header)
function initials(fullname: string): string {
  const parts = fullname.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
}

export function UserMenuDialog(props: UserMenuDialogProps) {
  const [dialogHtml, setDialogHtml] = createSignal<HTMLElement>();

  let onCloseLatest = props.onClose;
  createRenderEffect(() => {
    onCloseLatest = props.onClose;
  });

  onMount(() => {
    const handler = (event: MouseEvent) => {
      const dialog = dialogHtml();
      const node = event.target as Node | null;
      if (!dialog || !node) return;
      // Menu fermé (visibility:hidden) : ignorer, sinon chaque clic partout
      // hors racine déclencherait onClose inutilement
      if (dialog.classList.contains("pm-closed")) return;
      if (dialog.contains(node)) return;
      const root = props.menuRootRef();
      if (root?.contains(node)) return;
      onCloseLatest();
    };
    document.addEventListener("click", handler);
    onCleanup(() => document.removeEventListener("click", handler));
  });

  // Ouvre un dialog et referme le menu : le panel burger ne doit jamais
  // rester devant l'overlay/dialog modal (couches : page ≤ z-150, menu
  // z-199, dialogs z-200, notification z-500).
  const openAndClose = (open: () => void) => () => {
    onCloseLatest();
    open();
  };

  const user = () => storeService.proxy.user;
  const displayName = () => user()?.fullname?.trim() || "Votre profil";
  const sub = () => {
    const parts: string[] = [];
    if (user()?.orderNumber) parts.push(`n° ${user()!.orderNumber}`);
    if (user()?.department) parts.push(user()!.department);
    return parts.join(" · ");
  };

  return (
    <div
      ref={setDialogHtml}
      class={
        "absolute right-0 top-[54px] z-[199] w-[264px] rounded-[16px] p-1.5 text-white "
        + " origin-top-right transition duration-150 ease-out "
      }
      style={{
        "background": "linear-gradient(173deg,rgba(9,151,115,1) 0%, rgba(67,182,146,1) 100%)",
        "box-shadow": "0 18px 44px rgba(9,151,115,0.35)",
      }}
      classList={{
        "pm-open": props.openDialog,
        "pm-closed": !props.openDialog,
        "opacity-100": props.openDialog,
        "translate-y-0": props.openDialog,
        "scale-100": props.openDialog,
        "visible": props.openDialog,
        "pointer-events-auto": props.openDialog,
        "opacity-0": !props.openDialog,
        "-translate-y-1.5": !props.openDialog,
        "scale-[0.97]": !props.openDialog,
        "invisible": !props.openDialog,
        "pointer-events-none": !props.openDialog,
      }}
    >
      <div class="flex items-center gap-3 px-2.5 py-2.5 pb-3">
        <div class="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-white/60 bg-white/[0.18] font-[Lexend] text-sm font-semibold tracking-wide text-white">
          <Show
            when={(user()?.fullname ?? "").trim()}
            fallback={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M5 21c0-3.8 3.1-6 7-6s7 2.2 7 6" />
              </svg>
            }
          >
            {initials(user()!.fullname!)}
          </Show>
        </div>
        <div class="min-w-0">
          <p class="m-0 truncate font-[Nunito] text-[14.5px] font-bold leading-tight">{displayName()}</p>
          <Show when={sub()}>
            <p class="m-0 mt-0.5 font-[Nunito] text-[11.5px] text-white/85">{sub()}</p>
          </Show>
        </div>
      </div>

      <div class="mx-2 h-[1.5px] bg-white/25" />

      <MenuItem
        icon={<HiOutlineDocumentText size={18} />}
        text="Mes informations"
        onClick={openAndClose(() => openDialogTool(DIALOG_NAMES.registerInformations))}
      />
      <MenuItem
        icon={<HiOutlineFlag size={18} />}
        text="Signaler un bug"
        onClick={openAndClose(() => setReportBugOpen(true))}
      />

      <div class="mx-2 my-1 h-[1.5px] bg-white/25" />

      {/* Déconnexion : séparée + hover rouge (danger de l'app) */}
      <button
        onClick={() => {
          props.onClose();
          authService.logout();
        }}
        class="m-0 flex w-full cursor-pointer items-center gap-3 rounded-[10px] border-none bg-transparent px-2.5 py-[10.5px] text-left font-[Nunito] text-[13.5px] font-bold text-white/85 duration-150 hover:bg-[rgba(220,38,38,0.3)] hover:text-white"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Se déconnecter
      </button>

      {/* Instance dialog-only : le déclencheur est l'item "Signaler un bug" */}
      <ReportBugDialog hideTriggerButton />
    </div>
  );
}
