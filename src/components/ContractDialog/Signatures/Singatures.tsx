import { createSignal, onCleanup, onMount } from "solid-js";
import { DropdownItem } from "../../Dropdown/DropdownItem";
import { AccordionFieldsProps } from "../DropdownContratInformations/KineFields";
import { SignatureCanvas } from "./SignatureCanvas";
import { SignatureEditor } from "./SignatureEditor";
import { SignatureData, SignatureType } from "./types";
import { currentPDFTool } from "../../ContractEditor/PDFEditor";
import { signatureManager } from "./SignatureManager";
import { loadContract } from "../../../const.data";

export function Signatures(props: AccordionFieldsProps) {
    const [valid, setValid] = createSignal(false);
    const [selectedSignatory, setSelectedSignatory] = createSignal<SignatureType>("replaced");
    const [isEditorOpen, setIsEditorOpen] = createSignal(false);


    const handleEditSignature = (type: SignatureType) => {
        setSelectedSignatory(type);
        setIsEditorOpen(true);
    };

    const handleSaveSignature = (signatureData: string) => {
        signatureManager.updateSignature(selectedSignatory(), signatureData);

        // Mettre à jour les signatures dans le contrat après avoir mis à jour le signal
        currentPDFTool()?.updateSignaturesInContract(signatureManager.signatures);

        setIsEditorOpen(false);
        isValid()
    };

    const handleCloseEditor = () => {
        setIsEditorOpen(false);
    };

    const getExistingSignature = () => {
        const sigs = signatureManager.signatures();
        return selectedSignatory() === "replaced" ? sigs?.replaced : sigs?.substitute;
    };

    function isValid() {
        if (signatureManager.signatures()?.replaced && signatureManager.signatures()?.substitute) {
            setValid(true);
        } else {
            setValid(false);
        }
    }

    onMount(() => {
        if (loadContract()) {
            if (currentPDFTool()?.contractData.replacedSignatureDataUrl) {
                signatureManager.updateSignature("replaced", currentPDFTool()?.contractData.replacedSignatureDataUrl!);
                currentPDFTool()?.updateSignaturesInContract(signatureManager.signatures);
            }
            if (currentPDFTool()?.contractData.substituteSignatureDataUrl) {
                signatureManager.updateSignature("substitute", currentPDFTool()?.contractData.substituteSignatureDataUrl!);
                currentPDFTool()?.updateSignaturesInContract(signatureManager.signatures);
            }
        }
        isValid()
    })
    onCleanup(() => {
        // `''` (falsy) = getExistingSignature() renvoyait '' et sautait la
        // restauration à la réouverture — undefined neutralise proprement
        // (audit signatures (4)).
        signatureManager.setSignatures(undefined as SignatureData | undefined);
    });
    return (
        <DropdownItem
            id={4}
            title="Signatures"
            toggle={props.toggleItem}
            isOpen={
                (typeof props.items === "function" ? props.items() : props.items).find(
                    (i: { id: number }) => i.id === 4
                )?.isOpen ?? false
            }
            valid={valid()}
        >
            <div class="flex flex-col gap-3">
                <div class="flex justify-center sm:justify-between flex-wrap gap-1">
                    <SignatureCanvas
                        type="replaced"
                        onEdit={handleEditSignature}
                        canvasRef={signatureManager.setCanvasSignatureReplaced}
                    />
                    <SignatureCanvas
                        type="substitute"
                        onEdit={handleEditSignature}
                        canvasRef={signatureManager.setCanvasSignatureSubstitute}
                    />
                </div>
            </div>

            <SignatureEditor
                open={isEditorOpen()}
                onClose={handleCloseEditor}
                selectedType={selectedSignatory()}
                onSave={handleSaveSignature}
                existingSignature={getExistingSignature()}
            />
        </DropdownItem>
    );
}