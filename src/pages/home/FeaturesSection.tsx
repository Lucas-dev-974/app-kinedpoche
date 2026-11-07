import { For } from "solid-js";
import {
  HiOutlineCloud,
  HiOutlineDocumentText,
  HiOutlinePaperAirplane,
  HiOutlinePencil,
} from "solid-icons/hi";

const features = [
  {
    icon: HiOutlineDocumentText,
    title: "PDF automatique",
    text: "Se remplit avec vos informations, plus de copier-coller.",
  },
  {
    icon: HiOutlinePencil,
    title: "Signature au doigt",
    text: "Au cabinet comme en déplacement.",
  },
  {
    icon: HiOutlinePaperAirplane,
    title: "Envoi sécurisé",
    text: "Votre confrère signe sur son téléphone.",
  },
  {
    icon: HiOutlineCloud,
    title: "Suivi simple",
    text: "Contrats en cours et signés, lisibles d'un coup d'œil.",
  },
];

export function FeaturesSection() {
  return (
    <section class="mx-auto mt-8 max-w-[430px] px-5">
      <p class="m-0 text-xs font-bold uppercase tracking-wider text-[#099773]">Pourquoi l'utiliser</p>
      <h2 class="m-0 mt-1 font-[Lexend] text-xl font-bold text-[#14261f] md:text-2xl">
        Un outil unique pour vos contrats
      </h2>

      <div class="mt-3.5 grid grid-cols-2 gap-3">
        <For each={features}>
          {(feature) => (
            <div class="rounded-2xl border border-[#e3ece7] bg-[#f2f8f6] p-4">
              <div class="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] border border-[#e3ece7] bg-white text-[#099773]">
                <feature.icon size={18} />
              </div>
              <h3 class="m-0 mt-2.5 text-sm font-bold text-[#14261f]">{feature.title}</h3>
              <p class="m-0 text-[12.5px] leading-snug text-[#5b6b64]">{feature.text}</p>
            </div>
          )}
        </For>
      </div>
    </section>
  );
}
