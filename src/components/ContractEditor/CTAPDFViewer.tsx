import { createSignal } from "solid-js";
import { FiSave } from "solid-icons/fi";
import { VsFilePdf } from "solid-icons/vs";
import { Button } from "../buttons/Button";
import { ContractEntity } from "../../models/contract.entity";
import { contractService } from "../../services/contract.service";
import { NotificationService } from "../../utils/notification.service";
import storeService from "../../utils/store.service";
import { PDFViewerPrevisualisationDialog } from "../ContractDialog/PDFPrevisualisation/PDFViewerPrevisualisationDialog";
import { currentPDFTool } from "./PDFEditor";
import { loadContract } from "../../const.data";


export function CTAPDFViewer() {
    const [isSaving, setIsSaving] = createSignal(false);

    async function saveContractInDB() {
        // Garde : l'outil PDF peut ne pas être prêt (mount async) et un envoi est
        // déjà en cours → pas de double création de contrat par double-clic (audit 🟠).
        const pdfTool = currentPDFTool();
        if (!pdfTool || isSaving()) return;

        setIsSaving(true);
        try {
            const contractFromPDF: Partial<ContractEntity> = pdfTool.getContractData();

            if (!loadContract()) {
                const contract = await contractService.createContract(contractFromPDF);
                pdfTool.setContractData(contract);
                storeService.proxy.contracts = [...storeService.proxy.contracts!, contract]
                NotificationService.push({
                    content: "Contrat sauvegarder",
                    type: "info",
                });
            } else {
                const contract = await contractService.update(contractFromPDF);
                pdfTool.setContractData(contract);
                storeService.proxy.contracts = storeService.proxy.contracts?.map(_contract => {
                    if (_contract.id == contract.id) return contract
                    return _contract
                })

                NotificationService.push({
                    content: "Contrat mis à jour",
                    type: "info",
                });
            }
        } catch (error) {
            // Erreur déjà notifiée par le flux global (fetcher) —
            // pas d'unhandled rejection silencieuse.
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    }

    function downloadPDF() {
        // Garde `?.` : évite le TypeError si l'outil n'est pas prêt.
        const pdfTool = currentPDFTool();
        if (!pdfTool?.pdfFile) return;
        pdfTool.downloadModifiedPdfWithStoredSignatures(pdfTool.pdfFile).catch((error) => {
            // Erreur déjà loggée côté generation — notifier l'utilisateur (audit F4)
            console.error(error);
            NotificationService.push({
                content: "Erreur lors de la génération du PDF",
                type: "error"
            })
        });
    }


    return <div class="flex justify-end items-center gap-2 my-2">
        <Button
            onClick={downloadPDF}
            text="Télécharger le PDF modifié"
            size="xs"
            icon={<VsFilePdf size={19} />}
        />

        <Button
            onClick={saveContractInDB}
            text="Sauvegarder le PDF modifié"
            size="xs"
            icon={<FiSave size={19} />}
            disabled={isSaving()}
        />
        <PDFViewerPrevisualisationDialog />
    </div>
}
