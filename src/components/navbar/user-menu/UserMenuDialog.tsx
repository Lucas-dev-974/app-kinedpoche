import { ReportBugDialog } from "../../dialog/report-bug/ReportBugDialog";
import { UserMenuButton } from "./UserMenuButton";
import { authService } from "../../../services/auth.service";
import { Accessor, createRenderEffect, createSignal, onCleanup, onMount } from "solid-js";

interface UserMenuDialogProps {
  openDialog: boolean;
  onClose: () => void;
  menuRootRef: Accessor<HTMLElement | undefined>;
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
      if (dialog.classList.contains("hidden")) return;
      if (dialog.contains(node)) return;
      const root = props.menuRootRef();
      if (root?.contains(node)) return;
      onCloseLatest();
    };
    document.addEventListener("click", handler);
    onCleanup(() => document.removeEventListener("click", handler));
  });

  return (
    <div
      ref={setDialogHtml}
      class="absolute top-10  right-0 p-3  rounded-md shadow-lg z-[201]"
      style={{ "background": "linear-gradient(173deg,rgba(9, 151, 115, 1) 0%, rgba(67, 182, 146, 1) 100%)" }}
      classList={{
        hidden: !props.openDialog,
      }}
    >
      {/* Audit 🟠 : le `logout()` n'était jusqu'ici appelé QUE par le 401 — aucun
          moyen pour un kiné de se déconnecter volontairement. */}
      <UserMenuButton
        text="Se déconnecter"
        onClick={() => {
          props.onClose();
          authService.logout();
        }}
      />
      <ReportBugDialog />
    </div>
  );
}
