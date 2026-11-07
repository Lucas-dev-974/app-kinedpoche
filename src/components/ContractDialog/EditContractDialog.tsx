import { Show } from "solid-js";
import { currentPDFTool, PDFEditor } from "../ContractEditor/PDFEditor";
import { DialogWrapper } from "../dialog/DialogWrapper";
import { ContratInformationsDropdowns } from "./DropdownContratInformations/ContratInformationsDropdowns";
import { CTAPDFViewer } from "../ContractEditor/CTAPDFViewer";
import { PDFTool } from "../../utils/PDFTool";
import { loadContract, signeBack } from "../../const.data";

// Container façon dialog pro (même gabarit que "Mes informations") : carte
// blanche centrée, entête + footer d'actions fixes, body seul qui scrolle.
const CONTAINER_CLS =
  "fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-[200] "
  + "flex w-[94vw] max-w-[640px] max-h-[88vh] flex-col overflow-hidden rounded-2xl "
  + "bg-white ring-1 ring-black/[0.06] shadow-2xl";
const BODY_CLS = "min-h-0 w-full box-border flex-1 overflow-y-auto bg-white px-4 py-4 sm:px-5";

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

  function subtitle() {
    if (signeBack()) {
      return "Complétez ou ajustez, signez, puis sauvegardez.";
    }
    return "Remplissez les sections, prévisualisez puis sauvegardez.";
  }

  return (
    <DialogWrapper
      name="editContract"
      btnText="Créer un contrat"
      title={title()}
      subtitle={subtitle()}
      hideTriggerButton={props.hideTriggerButton}
      containerClassName={CONTAINER_CLS}
      bodyClassName={BODY_CLS}
      footer={<CTAPDFViewer />}
    >
      <div>
        <Show when={currentPDFTool() instanceof PDFTool}>
          <ContratInformationsDropdowns />
        </Show>

        <PDFEditor />
      </div>
    </DialogWrapper>
  );
}
