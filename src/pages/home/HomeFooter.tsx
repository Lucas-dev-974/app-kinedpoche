import { setReportBugOpen } from "../../components/dialog/report-bug/ReportBugDialog";

export function HomeFooter() {
  return (
    // pb-40 : passe sous le StickyCta (bottom-24 + ~50px) et le FloatingMenu (~90px)
    <footer class="pb-40 pt-9 px-5 mx-auto max-w-[430px] text-center text-xs text-[#5b6b64]">
      <button
        onClick={() => setReportBugOpen(true)}
        class="cursor-pointer border-none bg-transparent text-xs font-bold text-[#099773] hover:underline"
      >
        Signaler un bug
      </button>
      <p class="m-0 mt-2.5">© 2026 Kinéd'poche</p>
    </footer>
  );
}
