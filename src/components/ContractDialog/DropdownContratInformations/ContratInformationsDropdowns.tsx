import { DropdownWrapper } from "../../Dropdown/DropdownWrapper";
import { ContractInformationsFields } from "./ContractInformationsFields";
import { KineFields, setIsFilledWithUserReplaced, setIsFilledWithUserSubstitute } from "./KineFields";
import { onCleanup } from "solid-js";
import { Signatures } from "../Signatures/Singatures";
import { setFillMode } from "./formFillMode";

export function formatDateForInput(date: string | undefined) {
  if (!date) return ""
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function ContratInformationsDropdowns() {
  onCleanup(() => {
    setFillMode(null);
    setIsFilledWithUserReplaced(false);
    setIsFilledWithUserSubstitute(false);
  })

  return (
    // ids explicites : 1=Replacé, 2=Remplaçant, 3=Informations, 4=Signatures
    // (les DropdownItem font .find(id === N) — l'ordre du tableau n'importe pas)
    <DropdownWrapper multiple={true} itemsConfig={[{ id: 1, isOpen: false }, { id: 2, isOpen: false }, { id: 3, isOpen: false }, { id: 4, isOpen: false }]}>
      {(toggleItem, items) => (
        <>
          <ContractInformationsFields items={items} toggleItem={toggleItem} />
          <KineFields role="replaced" items={items} toggleItem={toggleItem} />
          <KineFields role="substitute" items={items} toggleItem={toggleItem} />
          <Signatures items={items} toggleItem={toggleItem} />
        </>
      )}
    </DropdownWrapper>
  );
}
