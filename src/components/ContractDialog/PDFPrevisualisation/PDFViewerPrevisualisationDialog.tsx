import { createSignal, Show } from "solid-js"
import { Portal } from "solid-js/web"
import { AiTwotoneEye } from 'solid-icons/ai'
import { PDFCanvas } from "../../ContractEditor/PDFCanvas"
import { SendContractTo } from "./SendContractTo"
import { currentPDFTool } from "../../ContractEditor/PDFEditor"

export function PDFViewerPrevisualisationDialog() {
    const [open, setOpen] = createSignal(false)


    return <>
        {/* Déclencheur secondaire (ghost) : cohérent avec le footer du dialog
            contrat ; désactivé tant que le PDFTool n'est pas prêt. */}
        <button
            onClick={() => setOpen(!open())}
            disabled={!currentPDFTool()}
            title="Prévisualiser le contrat rempli"
            class="m-0 flex cursor-pointer items-center gap-2 rounded-[10px] border border-slate-300 bg-white px-3.5 py-2 font-[Nunito] text-[13px] font-bold text-slate-600 duration-150 hover:border-slate-400 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
            <AiTwotoneEye size={16} />
            Aperçu
        </button>

        <Show when={open()}>
            <Portal>
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center p-2 sm:p-4 z-[200] pt-16 sm:pt-4" onClick={() => setOpen(false)}>
                    <div class="bg-white rounded-xl shadow-2xl w-full max-w-[700px] max-h-[calc(100vh-8rem)] sm:max-h-[90vh] overflow-hidden flex flex-col mt-4 sm:mt-0 " onClick={(e) => e.stopPropagation()}>
                        {/* Header avec titre */}
                        <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                            <h2 class="text-lg sm:text-xl font-semibold text-gray-800">Aperçu et envoi du contrat</h2>
                        </div>

                        {/* Contenu principal avec scroll */}
                        <div class="flex-1 overflow-y-auto min-h-0 ">
                            {/* Section PDF Viewer */}
                            <div class="p-3 sm:p-6 bg-gray-50">
                                <PDFCanvas />
                            </div>

                            {/* Section formulaire d'envoi */}
                            <div class="p-4 sm:p-6 bg-white border-t border-gray-200  mx-auto">
                                <SendContractTo setOpen={setOpen} />
                            </div>
                        </div>
                    </div>
                </div>
            </Portal>
        </Show>
    </>
}