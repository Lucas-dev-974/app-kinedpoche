import { HiOutlineCheckCircle, HiOutlinePlus } from "solid-icons/hi";
import { DIALOG_NAMES, openDialogTool } from "../../components/dialog/DialogWrapper";

const trustItems = ["Conforme", "Signature intégrée", "Zéro papier"];

export function HeroSection() {
  return (
    <header
      class="rounded-b-[26px] px-5 pb-12 pt-16 text-center text-white md:rounded-b-[34px]"
      // Continue la palette du Navbar (fin de gradient ≈ #43B692) puis approfondit :
      // la jointure Navbar → Hero est sans rupture de couleur.
      style={{ background: "linear-gradient(175deg, rgba(67,182,146,1) 0%, rgba(9,151,115,1) 58%, rgba(5,113,86,1) 100%)" }}
    >
      <div class="mx-auto max-w-[430px]">
        <span class="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/15 px-3.5 py-1.5 text-xs font-bold text-white/95">
          Fait pour les kinés libéraux
        </span>

        <h1 class="mt-4 font-[Lexend] text-[27px] font-bold leading-[1.25] tracking-tight text-white md:text-[34px]">
          Vos contrats de collaboration, prêts en trois clics
        </h1>

        <p class="mx-auto mt-3 max-w-[400px] text-[15px] leading-relaxed text-white/90">
          Génération automatique du PDF, signature sur l'écran, envoi à votre
          confrère. Tout se passe ici.
        </p>

        <div class="mt-6">
          <button
            onClick={() => openDialogTool(DIALOG_NAMES.editContract)}
            class="mx-auto flex w-full cursor-pointer items-center justify-center gap-2 rounded-[13px] border-none bg-white py-4 font-[Nunito] text-[15px] font-bold text-[#099773] shadow-[0_8px_20px_rgba(0,0,0,0.14)] duration-200 hover:-translate-y-px"
          >
            <HiOutlinePlus size={17} />
            Créer un contrat
          </button>

          <button
            onClick={() => openDialogTool(DIALOG_NAMES.registerInformations)}
            class="mt-2.5 w-full cursor-pointer rounded-[13px] border-[1.5px] border-white/65 bg-transparent py-[15px] font-[Nunito] text-[14px] font-bold text-white duration-200 hover:bg-white/10"
          >
            Compléter mes informations
          </button>
        </div>

        <div class="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {trustItems.map((label) => (
            <span class="inline-flex items-center gap-1.5 text-xs font-bold text-white/95">
              <HiOutlineCheckCircle size={13} color="rgba(223,243,236,1)" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
