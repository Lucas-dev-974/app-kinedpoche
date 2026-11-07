/**
 * Formate une date ISO / convertible en chaîne locale française (dd/mm/yyyy).
 * Niveau module utilitaire neutre : PDFTool et les composants du dialog
 * contrat l'importent sans créer de cycle avec utils/PDFTool (audit : cycle
 * PDFTool <→ ContractDialog qui rendait GenderEnum undefined si l'ordre
 * d'évaluation des modules changeait).
 */
export const formatDate = (date: string | undefined | null) => {
    if (!date) {
        return "";
    }

    const parsed = new Date(date);

    if (isNaN(parsed.getTime())) {
        return "";
    }

    return parsed.toLocaleDateString("fr-FR");
}
