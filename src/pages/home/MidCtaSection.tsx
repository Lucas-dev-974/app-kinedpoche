import { DIALOG_NAMES, openDialogTool } from "../../components/dialog/DialogWrapper";

export function MidCtaSection() {
  return (
    <section class="mx-auto mt-9 max-w-[430px] px-5">
      <div
        class="rounded-[18px] p-6 text-center text-white"
        style={{
          background: "linear-gradient(160deg, rgba(9,151,115,1) 0%, rgba(67,182,146,1) 100%)",
          "box-shadow": "0 14px 30px rgba(9,151,115,0.3)",
        }}
      >
        <h2 class="m-0 font-[Lexend] text-lg font-bold text-white md:text-xl">Prêt à essayer ?</h2>
        <p class="m-0 mt-1.5 text-xs text-white/90">Le premier contrat prend moins de 5 minutes.</p>
        <button
          onClick={() => openDialogTool(DIALOG_NAMES.editContract)}
          class="mt-4 w-full cursor-pointer rounded-[13px] border-none bg-white py-3.5 font-[Nunito] text-[15px] font-bold text-[#099773] duration-200 hover:-translate-y-px"
        >
          Créer un contrat
        </button>
      </div>
    </section>
  );
}
