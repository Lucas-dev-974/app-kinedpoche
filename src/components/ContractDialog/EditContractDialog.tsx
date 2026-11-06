import { Show } from "solid-js";
import { currentPDFTool, PDFEditor } from "../ContractEditor/PDFEditor";
import { DialogWrapper } from "../dialog/DialogWrapper";
import { ContratInformationsDropdowns } from "./DropdownContratInformations/ContratInformationsDropdowns";
import { PDFTool } from "../../utils/PDFTool";
import { loadContract, signeBack } from "../../const.data";


export function EditContractDialog() {
  function title() {
    if (signeBack()) {
      return "Signer un contrat";
    } else if (loadContract()) {
      return "Mettre à jour  un contrat";
    } else {
      return "Edité un nouveau contrat";
    }
  }
  return (
    <DialogWrapper
      name="editContract"
      btnText="Créer un contrat"
      title={title()}
    >
      <div class="max-h-[70vh]">
        <Show when={currentPDFTool() instanceof PDFTool}>
          <ContratInformationsDropdowns />
        </Show>

        <PDFEditor />
      </div>
    </DialogWrapper>
  );
}
