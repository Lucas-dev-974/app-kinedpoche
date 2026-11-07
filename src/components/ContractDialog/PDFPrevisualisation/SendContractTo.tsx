import { createSignal, Setter, onMount } from "solid-js"
import { mailService } from "../../../services/mail.service"
import { currentPDFTool } from "../../ContractEditor/PDFEditor"
import { LabeledInput } from "../../inputs/LabeledInput"
import { NotificationService } from "../../../utils/notification.service"
import { LabeledTextarea } from "../../inputs/LabeledTextarea"
import storeService from "../../../utils/store.service"
import { ContractEntity } from "../../../models/contract.entity"

export type ResponseTypeSendContractTo = {
    message?: string;
    error?: string;
    creatingContract?: {
        contract: Partial<ContractEntity>
    }
}

interface SendContractToProps {
    setOpen: Setter<boolean>
    /** API remontante : expose le submit et l'état d'envoi au footer du
        dialog (le bouton vit hors du body scrollable). Optionnel pour les
        usages autonomes (le bouton interne a été retiré — footer seul). */
    bindApi?: {
        submit: (fn: (e?: Event) => Promise<void>) => void
        setLoading: (value: boolean) => void
    }
}

export function SendContractTo(props: SendContractToProps) {
    const [mailFrom, setMailFrom] = createSignal(storeService.data.user?.email ?? "")
    const [mailTo, setMailTo] = createSignal("")
    const [mailBody, setMailBody] = createSignal("")

    // Le bouton d'envoi vit dans le footer du dialog : on remonte le handler
    // et l'état d'envoi au parent (mode footer actif uniquement).
    onMount(() => {
        props.bindApi?.submit(handleSubmit)
    })

    function setLoadingState(value: boolean) {
        props.bindApi?.setLoading(value)
    }

    // Validation des emails
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    const validateForm = (): boolean => {
        let isValid = true

        if (!mailFrom()) {
            NotificationService.push({
                content: "L'email expéditeur est requis",
                type: "error"
            })
            isValid = false
        } else if (!validateEmail(mailFrom())) {
            NotificationService.push({
                content: "Format d'email invalide",
                type: "error"
            })
            isValid = false
        }

        if (!mailTo()) {
            NotificationService.push({
                content: "L'email destinataire est requis",
                type: "error"
            })
            isValid = false
        } else if (!validateEmail(mailTo())) {
            NotificationService.push({
                content: "Format d'email invalide",
                type: "error"
            })
            isValid = false
        }

        return isValid
    }

    const handleSubmit = async (e?: Event) => {
        // Empêcher le rechargement de la page
        if (e) { e.preventDefault() }
        if (!validateForm()) { return }

        // F4 : garde AVANT le loading — sans outil PDF prêt, l'ancien `?.` sautait
        // silencieusement la génération et le blob global pouvait contenir le
        // PDF d'un envoi précédent.
        const pdfTool = currentPDFTool();
        if (!pdfTool?.pdfFile) {
            NotificationService.push({
                content: "Le PDF n'est pas encore prêt, réessayez dans un instant",
                type: "error"
            })
            return
        }

        setLoadingState(true)
        try {
            // Flux direct (audit propreté 07/11 P5) : l'ancienne chaîne passait
            // par le signal global toSendBlob surveillé par un createEffect —
            // un effet déclenché sur TOUTE écriture du signal, qui revalidait
            // le formulaire (double validation/notifications) et ne purgeait
            // pas le blob si ses conditions échouaient.
            const blob = await pdfTool.downloadModifiedPdfWithStoredSignatures(pdfTool.pdfFile, false)

            try {
                const response: ResponseTypeSendContractTo = await mailService.sendContratTo(buildFormData(blob))
                if (response.creatingContract?.contract) {
                    const contract = response.creatingContract.contract
                    currentPDFTool()?.setContractData(contract)
                    storeService.proxy.contracts = [...(storeService.proxy.contracts ?? []), contract]
                }
                NotificationService.push({
                    content: response.message || "Contrat envoyé.",
                    type: "info"
                })
                props.setOpen(false)
            } catch (error) {
                if (import.meta.env.DEV) {
                    console.error("Erreur lors de l'envoi:", error);
                }
                NotificationService.push({
                    content: "Erreur lors de l'envoi du contrat",
                    type: "error"
                })
            }
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error("Erreur lors de la génération du PDF:", error);
            }
            NotificationService.push({
                content: "Erreur lors de la génération du PDF",
                type: "error"
            })
        } finally {
            setLoadingState(false)
        }
    }

    const buildFormData = (blob: Blob): FormData => {
        const form = new FormData()
        form.append("contractFile", blob, "contrat.pdf")
        form.append("from", mailFrom())
        form.append("to", mailTo())
        form.append("body", mailBody())
        const contractData = currentPDFTool()?.contractData ?? {}
        form.append("contractData", JSON.stringify(contractData))
        return form
    }

    return (
        <div class="space-y-3.5">
            <div class="grid gap-x-4 gap-y-3.5 sm:grid-cols-2">
                <LabeledInput
                    id="mailFrom"
                    label="Votre email"
                    type="email"
                    value={mailFrom()}
                    onInput={(e) => { setMailFrom(e.target.value) }}
                    variant="pro"
                />

                <LabeledInput
                    id="mailTo"
                    label="Email destinataire"
                    type="email"
                    value={mailTo()}
                    onInput={(e) => { setMailTo(e.target.value) }}
                    variant="pro"
                />
            </div>

            <LabeledTextarea
                id="mailBody"
                label="Message (optionnel)"
                placeholder="Petit message d'accompagnement pour le confrère…"
                value={mailBody()}
                onInput={(value) => { setMailBody(value) }}
                rows={4}
                variant="pro"
            />
        </div>
    )
}