import { DocsViewsEnum } from "./BottomMenuPageRouter";

interface BottomMenuPageBtnGroupsProps {
    changeCurrentDocsView: (view: DocsViewsEnum) => void;
    currentDocsView: DocsViewsEnum;
}

// Onglets façon segmented control. Rendu seulement s'il y a AU MOINS 2 vues :
// un onglet seul n'a pas de raison d'être (l'en-tête porte déjà le contexte).
export function BottomMenuPageBtnGroups(props: BottomMenuPageBtnGroupsProps) {
    const PageBtnItems = [
        {
            title: "Contrats",
            action: () => props.changeCurrentDocsView(DocsViewsEnum.contract),
            id: DocsViewsEnum.contract
        },
        // {
        //     title: "Exo fiche client",
        //     action: () => props.changeCurrentDocsView(DocsViewsEnum.clientFiles),
        //     id: DocsViewsEnum.clientFiles
        // },
    ];

    if (PageBtnItems.length < 2) {
        return null;
    }

    return (
        <div class="mb-3 flex justify-end">
            <div class="inline-flex rounded-full bg-slate-100 p-1">
                {PageBtnItems.map((view) => (
                    <button
                        type="button"
                        onClick={view.action}
                        class={"m-0 cursor-pointer rounded-full px-4 py-1.5 font-[Nunito] text-[12.5px] font-bold duration-150 " + (props.currentDocsView == view.id
                            ? "bg-white text-[#099773] shadow-sm"
                            : "bg-transparent text-slate-500 hover:text-slate-700")}
                    >
                        {view.title}
                    </button>
                ))}
            </div>
        </div>
    );
}
