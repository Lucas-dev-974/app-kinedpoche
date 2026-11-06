import { contractService } from "../../../../../services/contract.service";
import { ContractEntity } from "../../../../../models/contract.entity";
import { DIALOG_NAMES, openDialogTool } from "../../../../dialog/DialogWrapper";
import { createEffect, createSignal, on, onMount } from "solid-js";
import storeService, { localeUpdateEvent } from "../../../../../utils/store.service";
import { loggedIn, setLoadContrat } from "../../../../../const.data";
import { ConfirmationDialog } from "../../../../dialog/ConfirmationDialog";
import { SearchInput } from "../../../../inputs/SearchInput";
import { DataTable } from "../../../../table/DataTable";
import { TableColumn } from "../../../../table/TableTypes";
import { ContractTableRowActions } from "./ContractTableRow";
import { useContractSearch } from "../../../../../utils/hooks/useContractSearch";

export const [contracts, setContracts] = createSignal<ContractEntity[]>([]);

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

  const tableColumns: TableColumn<ContractEntity>[] = [
    {
      key: "replacedName",
      label: "Remplaçé",
      align: "left",
      width: "33%",
    },
    {
      key: "substituteName",
      label: "Remplaçant",
      align: "center",
      width: "33%",
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      width: "33%",
      render: (contract) => (
        <ContractTableRowActions
          contract={contract}
          onEdit={openDialogTool_}
          onDelete={requestDeleteContract}
          getLocalContract={getLocalContract}
        />
      ),
    },
  ];

  return (
    <div class="m-0">
      <SearchInput
        placeholder="Recherche"
        onInput={performSearch}
      />
      <DataTable
        columns={tableColumns}
        data={filteredContracts()}
        emptyMessage="Aucun contrat trouvé"
      />

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
