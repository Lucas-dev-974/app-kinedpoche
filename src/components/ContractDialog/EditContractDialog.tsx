import { Show } from "solid-js";
import { currentPDFTool, PDFEditor } from "../ContractEditor/PDFEditor";
import { DialogWrapper } from "../dialog/DialogWrapper";
import { ContratInformationsDropdowns } from "./DropdownContratInformations/ContratInformationsDropdowns";
import { PDFTool } from "../../utils/PDFTool";
import { loadContract, signeBack } from "../../const.data";


interface EditContractDialogProps {
  /** Quand true, seuls les dialogs sont rendus : le déclencheur est un CTA
      externe (Home) qui appelle openDialogTool(DIALOG_NAMES.editContract). */
  hideTriggerButton?: boolean;
}

export function EditContractDialog(props: EditContractDialogProps) {
  function title() {
    if (signeBack()) {
      return "Signer un contrat";
    } else if (loadContract()) {
      return "Mettre à jour un contrat";
    } else {
      return "Éditer un nouveau contrat";
    }
  }
  return (
    <DialogWrapper
      name="editContract"
      btnText="Créer un contrat"
      title={title()}
      hideTriggerButton={props.hideTriggerButton}
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
