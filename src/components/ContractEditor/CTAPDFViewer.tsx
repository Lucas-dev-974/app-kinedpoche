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
            const contractFromPDF: Partial<ContractEntity> = { ...pdfTool.getContractData() };

            // QA 06/11 : après une 1ʳᵉ sauvegarde, contractData porte id+token —
            // re-sauvegarder doit METTRE À JOUR ce contrat (l'API délègue
            // id+token vers l'update, cf. patch C1) au lieu de re-ajouter une
            // entrée au store (le bug créait des doublons [5,5] et la
            // suppression d'une ligne purgait toutes les lignes du même id).
            const alreadySaved = !!contractFromPDF.id || !!contractFromPDF.token;
            if (!loadContract() && !alreadySaved) {
                const contract = await contractService.createContract(contractFromPDF);
                pdfTool.setContractData(contract);
                storeService.proxy.contracts = [...(storeService.proxy.contracts ?? []), contract]
                NotificationService.push({
                    content: "Contrat sauvegardé",
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


    // Barre d'actions fixe (footer du dialog) : hiérarchie claire — aperçu et
    // téléchargement en secondaire, sauvegarde en primaire. Boutons désactivés
    // tant que le PDFTool n'est pas prêt (mount async), garde interne conservée.
    const toolReady = () => !!currentPDFTool();

    const ghostBtn =
        "m-0 flex cursor-pointer items-center gap-2 rounded-[10px] border border-slate-300 "
        + "bg-white px-3.5 py-2 font-[Nunito] text-[13px] font-bold text-slate-600 duration-150 "
        + "hover:border-slate-400 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <div class="flex w-full box-border flex-none flex-wrap items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50 px-4 py-3 sm:px-5">
            {/* Le déclencheur d'aperçu (état open) reste dans PDFViewerPrevisualisationDialog */}
            <PDFViewerPrevisualisationDialog />
            <button
                onClick={downloadPDF}
                class={ghostBtn}
                disabled={!toolReady()}
                title="Télécharger le PDF avec vos signatures"
            >
                <VsFilePdf size={16} />
                Télécharger
            </button>
            <Button
                onClick={saveContractInDB}
                text={isSaving() ? "Sauvegarde..." : "Sauvegarder"}
                icon={<FiSave size={16} />}
                disabled={isSaving() || !toolReady()}
            />
        </div>
    );
}
