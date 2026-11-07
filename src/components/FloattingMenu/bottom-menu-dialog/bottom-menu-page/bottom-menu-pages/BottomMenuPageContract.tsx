import { contractService } from "../../../../../services/contract.service";
import { ContractEntity } from "../../../../../models/contract.entity";
import { DIALOG_NAMES, openDialogTool } from "../../../../dialog/DialogWrapper";
import { createEffect, createSignal, For, on, onMount, Show } from "solid-js";
import storeService, { localeUpdateEvent } from "../../../../../utils/store.service";
import { loggedIn, setLoadContrat } from "../../../../../const.data";
import { ConfirmationDialog } from "../../../../dialog/ConfirmationDialog";
import { SearchInput } from "../../../../inputs/SearchInput";
import { useContractSearch } from "../../../../../utils/hooks/useContractSearch";
import { FiEdit } from "solid-icons/fi";
import { TiDeleteOutline } from "solid-icons/ti";

export const [contracts, setContracts] = createSignal<ContractEntity[]>([]);

// Affichage dd/mm/yyyy sans décalage de fuseau : les dates du store sont des
// "YYYY-MM-DD" brutes — `new Date()` les lirait en UTC et fr-FR reculerait
// d'un jour en CET. Découpage manuel volontaire.
function toDisplayDate(iso: string | undefined): string {
    const [y, m, d] = (iso ?? "").slice(0, 10).split("-");
    return y && m && d ? `${d}/${m}/${y}` : "";
}

export function BottomMenuPageContract() {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = createSignal(false);
  const [contractToDelete, setContractToDelete] = createSignal<ContractEntity | null>(null);

  const { filteredContracts, performSearch, setFilteredContracts } = useContractSearch(contracts);

  createEffect(on(localeUpdateEvent, () => {
    const updatedContracts = storeService.proxy.contracts as ContractEntity[];
    setContracts(updatedContracts);
    setFilteredContracts(updatedContracts);
  }))

  // async function SynchronizeContracts() {
  //   const contracts = storeService.proxy.contracts as Partial<ContractEntity>[]
  //   const request = await contractService.registerLocaleContractToBDD(contracts)
  //   storeService.proxy.contracts = request
  // }

  onMount(async () => {
    // F3 : les appels serveur peuvent lever (401 après perte de session, réseau)
    // — pas de unhandled rejection : on garde la liste locale du store en fallback.
    let serverContracts: ContractEntity[] | undefined;
    try {
      if (loggedIn()) {
        serverContracts = await contractService.list();
      } else {
        let idsTokens = []
        for (const contract of storeService.proxy.contracts!) {
          idsTokens.push([contract.id, contract.token]);
        }

        serverContracts = await contractService.listFromIDSToken(idsTokens as [number, string][]);
      }
    } catch {
      // Erreur déjà notifiée par le fetcher — liste locale conservée
    }

    if (serverContracts) {
      // Synchroniser le store avec la liste serveur (évite désync local/serveur,
      // cf. audit : la liste serveur n'était jamais écrite dans le store)
      storeService.proxy.contracts = serverContracts;
      setContracts(serverContracts);
      setFilteredContracts(serverContracts);
    } else {
      setContracts((storeService.proxy.contracts ?? []) as ContractEntity[]);
    }
  });

  function openDialogTool_(contract: ContractEntity) {
    setLoadContrat(contract);
    openDialogTool(DIALOG_NAMES.editContract);
  }

  function requestDeleteContract(contract: ContractEntity) {
    setContractToDelete(contract);
    setShowDeleteConfirmation(true);
  }

  async function confirmDeleteContract() {
    const contract = contractToDelete();
    if (!contract) return;

    setShowDeleteConfirmation(false);

    if (loggedIn()) {
      try {
        await contractService.delete(contract.id);
      } catch {
        // Erreur déjà notifiée par le fetcher (401/500, cf. audit 🟠 item 3) :
        // ne pas retirer la ligne localement — le contrat existe toujours en base.
        setContractToDelete(null);
        return;
      }
      storeService.proxy.contracts = storeService.proxy.contracts?.filter(contract_ => contract_.id !== contract.id);
    } else {
      storeService.proxy.contracts = storeService.proxy.contracts!.filter((contract_: Partial<ContractEntity>) => contract_.id !== contract.id);
    }

    const updatedContracts = storeService.proxy.contracts as ContractEntity[];
    setContracts(updatedContracts);
    setFilteredContracts(updatedContracts.filter((c) => c.id !== contract.id));

    setContractToDelete(null);
  }

  function cancelDeleteContract() {
    setShowDeleteConfirmation(false);
    setContractToDelete(null);
  }

  function getLocalContract(contract: ContractEntity): ContractEntity | undefined {
    return storeService.proxy.contracts?.find(contract_ => contract_.id === contract.id) as ContractEntity | undefined;
  }

  return (
    <div class="m-0">
      <SearchInput
        placeholder="Recherche"
        onInput={performSearch}
      />

      {/* Liste d'items (remplace le tableau, peu lisible en feuille mobile) :
          ligne principale = « remplacé → remplaçant », une sous-ligne de
          métadonnées, actions en boutons-cercles. */}
      <Show
        when={filteredContracts().length > 0}
        fallback={
          <div class="flex flex-col items-center py-12 text-center">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2.75h7.5L19 8.25v10.5a2.5 2.5 0 0 1-2.5 2.5h-10.5A2.5 2.5 0 0 1 3.5 18.75V5.25A2.5 2.5 0 0 1 6 2.75Z" />
              <path d="M13.25 3v5h5.5" />
              <path d="M7.25 11.5h6.5" />
              <path d="M7.25 14.5h6.5" />
              <path d="M7.25 17.75c.9-1.5 2.2-1.9 3-.9.7.9 1.9.7 3-.7" />
            </svg>
            <p class="m-0 mt-3 font-[Nunito] text-[13.5px] font-bold text-slate-600">Aucun contrat trouvé</p>
            <p class="m-0 mt-0.5 max-w-[280px] font-[Nunito] text-[12px] text-slate-400">
              Créez un contrat, il apparaîtra ici avec ses détails.
            </p>
          </div>
        }
      >
        <ul class="m-0 list-none overflow-hidden rounded-[14px] bg-white p-0 ring-1 ring-slate-200 divide-y divide-slate-100">
          <For each={filteredContracts()}>
            {(contract) => (
              <li class="m-0 flex list-none items-center gap-1 p-0">
                {/* Zone principale cliquable (clavier inclus) = édition */}
                <button
                  type="button"
                  onClick={() => openDialogTool_(getLocalContract(contract) || contract)}
                  class="m-0 min-w-0 flex-1 cursor-pointer select-none border-none bg-transparent px-4 py-3 text-left duration-150 hover:bg-slate-50"
                  aria-label={`Éditer le contrat entre ${contract.replacedName || "le remplaçé"} et ${contract.substituteName || "le remplaçant"}`}
                >
                  <p class="m-0 truncate font-[Nunito] text-[13.5px] font-bold text-slate-700">
                    {contract.replacedName?.trim() || "Kiné anonyme"}
                    <span class="mx-1.5 font-normal text-[#099773]">→</span>
                    {contract.substituteName?.trim() || "Confrère anonyme"}
                  </p>
                  <p class="m-0 mt-0.5 truncate font-[Nunito] text-[12px] font-medium text-slate-500">
                    {toDisplayDate(contract.startDate) || toDisplayDate(contract.endDate)
                      ? `${toDisplayDate(contract.startDate) || "?"} – ${toDisplayDate(contract.endDate) || "?"}`
                      : "Dates à compléter"}
                    <Show when={contract.percentReturnToSubstitute !== undefined && contract.percentReturnToSubstitute !== null}>
                      {" · "}{contract.percentReturnToSubstitute}{"%"}
                    </Show>
                    <Show when={contract.doneAtLocation?.trim()}>
                      {" · Fait à "}{contract.doneAtLocation}
                    </Show>
                  </p>
                </button>

                {/* Actions : cercles discrets (édition verte, suppression rouge doux) */}
                <div class="flex flex-none items-center gap-1 pr-2.5">
                  <button
                    type="button"
                    aria-label="Modifier le contrat"
                    onClick={() => openDialogTool_(getLocalContract(contract) || contract)}
                    class="m-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-[#099773] duration-150 hover:bg-[#099773]/10"
                  >
                    <FiEdit size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="Supprimer le contrat"
                    onClick={() => requestDeleteContract(contract)}
                    class="m-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-slate-400 duration-150 hover:bg-red-50 hover:text-red-600"
                  >
                    <TiDeleteOutline size={17} />
                  </button>
                </div>
              </li>
            )}
          </For>
        </ul>
      </Show>

      <ConfirmationDialog
        isOpen={showDeleteConfirmation()}
        title="Supprimer le contrat"
        message={`Êtes-vous sûr de vouloir supprimer le contrat entre ${contractToDelete()?.replacedName || "le remplaçant"} et ${contractToDelete()?.substituteName || "le substitut"} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={confirmDeleteContract}
        onCancel={cancelDeleteContract}
      />
    </div>
  );
}
