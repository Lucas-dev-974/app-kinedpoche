import { FaSolidChevronLeft, FaSolidChevronRight } from "solid-icons/fa";
import { currentPDFTool } from "./PDFEditor";
import { createSignal } from "solid-js";

interface PDFActionsProps {
    changePage: (index: number) => void;
}

export function PDFActions(props: PDFActionsProps) {
    const [currentPage, setCurrentPage] = createSignal<number>(currentPDFTool()?.currentPage ?? 1);

    function pagination(page: number) {
        // Garde : l'outil PDF peut ne pas être prêt (audit 🟡)
        const pdfTool = currentPDFTool();
        if (!pdfTool) return;
        props.changePage(page);
        setCurrentPage(pdfTool.currentPage);
    }


    return (
        <div class="ml-auto inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200 shadow-sm">
            <button
                type="button"
                aria-label="Page précédente"
                class="m-0 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-slate-600 duration-150 hover:bg-slate-100"
                onClick={() => pagination(-1)}
            >
                <FaSolidChevronLeft size={12} />
            </button>
            <p class="m-0 font-[Nunito] text-[12px] font-bold text-slate-600">
                {currentPage()} sur {currentPDFTool()?.numPages ?? "-"}
            </p>
            <button
                type="button"
                aria-label="Page suivante"
                class="m-0 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-slate-600 duration-150 hover:bg-slate-100"
                onClick={() => pagination(+1)}
            >
                <FaSolidChevronRight size={12} />
            </button>
        </div>
    )
}