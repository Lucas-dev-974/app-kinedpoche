import { createSignal, Setter } from "solid-js"
import { mailService } from "../../../services/mail.service"
import { Button } from "../../buttons/Button"
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

export function SendContractTo(props: {
    setOpen: Setter<boolean>
}) {
    const [mailFrom, setMailFrom] = createSignal("")
    const [mailTo, setMailTo] = createSignal("")
    const [mailBody, setMailBody] = createSignal("")

    const [isLoading, setIsLoading] = createSignal(false)

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

        setIsLoading(true)
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
            setIsLoading(false)
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
        <div class="space-y-6">
            {/* Titre de la section */}
            <div class="text-center">
                <h3 class="text-base sm:text-lg font-medium text-gray-900">Envoyer le contrat par email</h3>
                <p class="text-xs sm:text-sm text-gray-600">Remplissez les informations ci-dessous pour envoyer le contrat signé</p>
            </div>

            {/* Formulaire */}
            <div class=" flex flex-col gap-2">
                <LabeledInput
                    id="mailFrom"
                    label="Votre email"
                    type="email"
                    value={mailFrom()}
                    onInput={(e) => { setMailFrom(e.target.value) }}
                />

                <LabeledInput
                    id="mailTo"
                    label="Email destinataire"
                    type="email"
                    value={mailTo()}
                    onInput={(e) => { setMailTo(e.target.value) }}
                />

                <LabeledTextarea
                    id="mailBody"
                    label="Corps de l'email"
                    value={mailBody()}
                    onInput={(value) => { setMailBody(value) }}
                />
            </div>

            <div class="flex justify-center pt-4">
                <Button
                    text={isLoading() ? "Envoi en cours..." : "Envoyer le contrat"}
                    onClick={() => handleSubmit()}
                    disabled={isLoading()}
                    class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                />
            </div>
        </div>
    )
}