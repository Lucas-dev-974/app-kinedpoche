import { createSignal, Show } from "solid-js";
import { DialogWrapper } from "../DialogWrapper";
import { UserMenuButton } from "../../navbar/user-menu/UserMenuButton";
import { Portal } from "solid-js/web";
import { Button } from "../../buttons/Button";
import { mailService } from "../../../services/mail.service";
import { NotificationService } from "../../../utils/notification.service";

// État au niveau module : n'importe quel composant (footer Home, menu user)
// peut ouvrir le dialog via setReportBugOpen(true). Le composant est monté
// en permanence dans UserMenuDialog (Portal rend l'overlay au niveau du body).
const [isOpen, setIsOpen] = createSignal(false);
export const setReportBugOpen = setIsOpen;

export function ReportBugDialog(props: { hideTriggerButton?: boolean }) {
    const [reportContent, setReportContent] = createSignal("");
    const [screenshots, setScreenshots] = createSignal<File[]>([]);
    const [isLoading, setIsLoading] = createSignal(false);

    const closeDialog = () => {
        setIsOpen(false);
        setReportContent("");
        setScreenshots([]);
        setIsLoading(false);
    };

    const onFileInput = (event: Event) => {
        const input = event.currentTarget as HTMLInputElement;
        const files = input.files ? Array.from(input.files) : [];
        setScreenshots(files);
    };

    const onSubmit = async () => {
        if (!reportContent().trim()) {
            NotificationService.push({
                content: "La description du bug est requise.",
                type: "error",
            });
            return;
        }

        const formData = new FormData();
        formData.append("reportContent", reportContent().trim());
        screenshots().forEach((file) => {
            formData.append("screenshots", file);
        });

        setIsLoading(true);
        try {
            const response = await mailService.reportBug(formData);
            NotificationService.push({
                content: response.message || "Signalement envoyé avec succès.",
                type: "info",
            });
            closeDialog();
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error("Erreur lors de l'envoi du bug:", error);
            }
            NotificationService.push({
                content: "Erreur lors de l'envoi du signalement.",
                type: "error",
            });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div>
            {/* Déclencheur optionnel : les item menus (UserMenuDialog, footer Home)
                ouvrent via setReportBugOpen(true) et cachent ce bouton. */}
            <Show when={!props.hideTriggerButton}>
                <UserMenuButton
                    text="Signaler un bug"
                    onClick={() => setIsOpen(true)}
                />
            </Show>
            <Portal>
                <DialogWrapper
                    name="reportBugDialog"
                    btnText="Signaler un bug"
                    title="Signaler un bug"
                    isOpen={isOpen()}
                    onClose={closeDialog}
                    hideTriggerButton
                >
                    <div class="flex flex-col gap-4 font-[Nunito]">
                        <p class="m-0 text-sm text-gray-600">
                            Donnez un maximum de contexte pour nous aider à corriger le problème rapidement.
                        </p>

                        <div class="grid grid-cols-1 gap-1">
                            <label for="bug-description" class="text-sm font-semibold text-gray-700">
                                Description
                            </label>
                            <textarea
                                id="bug-description"
                                placeholder="Exemple: en cliquant sur 'Valider', la page se bloque..."
                                value={reportContent()}
                                onInput={(e) => setReportContent(e.currentTarget.value)}
                                class=" min-h-[250px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm resize-y focus:outline-none focus:ring-2 focus:ring-[#099773]/30 focus:border-[#099773]"
                            />
                        </div>

                        <div class="grid grid-cols-1 gap-1">
                            <label for="bug-file" class="text-sm font-semibold text-gray-700">
                                Pièce jointe (optionnelle)
                            </label>
                            <input
                                id="bug-file"
                                type="file"
                                multiple
                                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                                onInput={onFileInput}
                                class=" rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-[#099773]/10 file:px-3 file:py-1.5 file:font-[Nunito] file:text-sm file:font-semibold file:text-[#099773] hover:file:bg-[#099773]/20"
                            />
                            <p class="m-0 text-xs text-gray-500">
                                Ajoutez une capture d'écran ou un fichier utile pour reproduire le bug.
                            </p>
                        </div>

                        <div class="flex justify-end pt-1">
                            <Button
                                text={isLoading() ? "Envoi en cours..." : "Envoyer"}
                                onClick={onSubmit}
                                disabled={isLoading()}
                                size="medium"
                            />
                        </div>
                    </div>
                </DialogWrapper>
            </Portal>
        </div>
    )
}