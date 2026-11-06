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


    return <div class="flex justify-end">
        <div class="flex items-center">
            <button class="bg-transparent flex items-center border-none outline-none" onClick={() => pagination(-1)} > <FaSolidChevronLeft size={16} /> </button>
            <p class="mx-4 text-sm"> {currentPage()} sur {currentPDFTool()?.numPages ?? "-"} </p>
            <button class="bg-transparent flex items-center border-none outline-none" onClick={() => pagination(+1)} > <FaSolidChevronRight size={16} /> </button >
        </div>
    </div>
}