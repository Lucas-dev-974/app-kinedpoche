import { createSignal } from "solid-js"
import { Portal } from "solid-js/web"
import { AiTwotoneEye } from 'solid-icons/ai'
import { FiSend } from 'solid-icons/fi'
import { PDFCanvas } from "../../ContractEditor/PDFCanvas"
import { SendContractTo } from "./SendContractTo"
import { currentPDFTool } from "../../ContractEditor/PDFEditor"
import { Button } from "../../buttons/Button"
import { DialogWrapper } from "../../dialog/DialogWrapper"

// Dialog "Aperçu" — même système de gabarit que les autres dialogs pro :
// DialogWrapper contrôlé (isOpen/close), monté en Portal pour échapper au
// dialog contrat (z parent 200). Couches : contrat 200 < aperçu 210 < notif 500.
export function PDFViewerPrevisualisationDialog() {
    const [open, setOpen] = createSignal(false)
    const [sending, setSending] = createSignal(false)
    const [bound, setBound] = createSignal(false)
    let submitFn: ((e?: Event) => Promise<void>) | undefined = undefined

    const sectionTitleCls = "m-0 mb-3 flex items-center gap-2 font-[Nunito] text-[11px] font-bold uppercase tracking-[0.09em] text-slate-400"

    return (
        <>
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

            <Portal>
                <DialogWrapper
                    name="pdfPreviewDialog"
                    isOpen={open()}
                    onClose={() => setOpen(false)}
                    hideTriggerButton
                    btnText="Envoyer le contrat"
                    title="Aperçu du contrat"
                    subtitle="Vérifiez le rendu, puis envoyez-le au confrère."
                    containerClassName={
                        "fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-[210] "
                        + "flex w-[96vw] max-w-[720px] max-h-[92vh] flex-col overflow-hidden rounded-2xl "
                        + "bg-white ring-1 ring-black/[0.06] shadow-2xl"
                    }
                    bodyClassName="min-h-0 w-full box-border flex-1 overflow-y-auto bg-slate-50"
                    footer={
                        <div class="flex w-full box-border flex-none flex-wrap items-center justify-end gap-2.5 border-t border-slate-100 bg-white px-4 py-3 sm:px-5">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                class="m-0 cursor-pointer rounded-[10px] border border-slate-300 bg-white px-4 py-2 font-[Nunito] text-[13.5px] font-bold text-slate-600 duration-150 hover:border-slate-400 hover:text-slate-700"
                            >
                                Annuler
                            </button>
                            <Button
                                text={sending() ? "Envoi en cours..." : "Envoyer le contrat"}
                                icon={<FiSend size={16} />}
                                onClick={() => submitFn?.()}
                                disabled={sending() || !bound()}
                            />
                        </div>
                    }
                >
                    {/* Rendu du contrat (canvas max-w 600px : les plaques
                        signature se positionnent sur cette base — ne pas élargir). */}
                    <div class="p-4 sm:p-6">
                        <PDFCanvas />
                    </div>

                    {/* Section envoi */}
                    <div class="border-t border-slate-100 bg-white px-4 py-5 sm:px-6">
                        <p class={sectionTitleCls}>
                            <span class="h-[6px] w-[6px] flex-none rounded-full bg-[#099773]" />
                            Envoi par email
                        </p>
                        <SendContractTo
                            setOpen={setOpen}
                            bindApi={{
                                submit: (fn) => { submitFn = fn; setBound(true) },
                                setLoading: setSending,
                            }}
                        />
                    </div>
                </DialogWrapper>
            </Portal>
        </>
    )
}