import { For, Show } from "solid-js";

const steps = [
  {
    title: "Complétez votre profil kiné",
    text: "Numéro d'ordre, adresses, coordonnées — renseignés une fois, réutilisés partout.",
  },
  {
    title: "Créez le contrat adapté",
    text: "Le PDF est généré automatiquement avec vos informations et celles du confrère.",
  },
  {
    title: "Signez et envoyez",
    text: "Signature sur l'écran, puis un lien sécurisé : votre confrère signe à son tour.",
  },
];

export function StepsSection() {
  return (
    <section class="mx-auto mt-10 max-w-[430px] px-5">
      <p class="m-0 text-xs font-bold uppercase tracking-wider text-[#099773]">Comment ça marche</p>
      <h2 class="m-0 mt-1 font-[Lexend] text-xl font-bold text-[#14261f] md:text-2xl">
        Trois étapes, pas de paperasse
      </h2>

      <div class="mt-3">
        <For each={steps}>
          {(step, i) => (
            <div class="relative grid grid-cols-[38px_1fr] gap-3.5 py-3.5">
              <Show when={i() < steps.length - 1}>
                {/* Connecteur vertical entre les pastilles numérotées */}
                <div class="absolute bottom-[-8px] left-[18.5px] top-[54px] w-[2px] bg-[#e3ece7]" />
              </Show>
              <div
                class="flex h-[38px] w-[38px] items-center justify-center rounded-xl font-[Lexend] text-base font-bold text-white"
                style={{ background: "linear-gradient(160deg, rgba(9,151,115,1) 0%, rgba(67,182,146,1) 100%)" }}
              >
                {i() + 1}
              </div>
              <div>
                <h3 class="m-0 text-[15.5px] font-bold text-[#14261f]">{step.title}</h3>
                <p class="m-0 text-[13.5px] leading-snug text-[#5b6b64]">{step.text}</p>
              </div>
            </div>
          )}
        </For>
      </div>
    </section>
  );
}
