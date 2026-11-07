import { onMount } from "solid-js";
import { currentPDFTool } from "./PDFEditor";
import { PDFInputsOnCanvas, setCanvasInputs } from "./PDFInputsOnCanvas";
import { PDFActions } from "./PDFActions";
import { signatureManager } from "../ContractDialog/Signatures";

export function PDFCanvas() {
    onMount(async () => {
        const canvas = document.getElementById("pdf-canvas") as HTMLCanvasElement | null;
        if (!canvas) return;
        // Garde : l'outil peut ne pas être prêt au mount (initialisation async)
        const pdfTool = currentPDFTool();
        if (!pdfTool) return;
        await pdfTool.renderPage(canvas);
        updateCanvasInputsFromTool()
    })

    async function pagination(page: number) {
        const canvas = document.getElementById("pdf-canvas") as HTMLCanvasElement | null
        if (!canvas) return
        const pdfTool = currentPDFTool()
        if (!pdfTool?.numPages) return

        const lastPageNumber = pdfTool.numPages
        if (page === +1 && pdfTool.currentPage == lastPageNumber) {
            pdfTool.setCurrentPage(1);
        } else if (page === -1 && pdfTool.currentPage == 1) {
            pdfTool.setCurrentPage(lastPageNumber);
        } else {
            pdfTool.setCurrentPage(pdfTool.currentPage + page);
        }

        await pdfTool.renderPage(canvas);
        updateCanvasInputsFromTool()

        // Manage signature canvases visibility per page (les signatures vivent
        // sur la DERNIÈRE page, plus codée en dur à 6)
        if (pdfTool.currentPage === lastPageNumber) {
            displaySigsLastPage();
        } else {
            removeSigsCanvases();
        }
    }


    function updateCanvasInputsFromTool() {
        const pdfTool = currentPDFTool();
        if (!pdfTool) return
        // `filter(...)[0].fields` levait un TypeError si aucune page ne matchait
        // (audit 🟠) — find + fallback explicite sur une liste vide.
        const pageMeta = pdfTool.PDFInputsFieldsMetadata?.find((page) => page.page == pdfTool.currentPage);
        setCanvasInputs(pageMeta ? [...pageMeta.fields] : [])
    }

    function displaySigsLastPage() {
        if (currentPDFTool()?.currentPage !== currentPDFTool()?.numPages) return;

        const pdfCanvas = document.getElementById("pdf-canvas") as HTMLCanvasElement | null;
        if (!pdfCanvas || !pdfCanvas.parentElement) return;

        const container = pdfCanvas.parentElement as HTMLElement;

        // Reuse if already present, otherwise create
        let replacedCanvas = container.querySelector('canvas[data-sig="replaced"]') as HTMLCanvasElement | null;
        let substituteCanvas = container.querySelector('canvas[data-sig="substitute"]') as HTMLCanvasElement | null;

        const ensureCanvas = (existing: HTMLCanvasElement | null, dataAttr: string) => {
            if (existing) return existing;
            const c = document.createElement("canvas");

            c.setAttribute("data-sig", dataAttr);
            c.width = 220;
            c.height = 120;
            c.style.background = "transparent"
            c.style.position = "absolute";
            c.style.pointerEvents = "none";
            container.append(c);
            return c;
        };

        replacedCanvas = ensureCanvas(replacedCanvas, "replaced");
        substituteCanvas = ensureCanvas(substituteCanvas, "substitute");

        // Positioning relative to the PDF canvas size
        const baseWidth = 600; // matches max PDF canvas width in UI
        const scale = pdfCanvas.clientWidth / baseWidth;
        const replacedPos = { left: 80, top: 620 };
        const substitutePos = { left: 340, top: 620 };

        replacedCanvas.style.left = `${Math.round(replacedPos.left * scale)}px`;
        replacedCanvas.style.top = `${Math.round(replacedPos.top * scale)}px`;
        replacedCanvas.style.width = `${Math.round(replacedCanvas.width * scale)}px`;
        replacedCanvas.style.height = `${Math.round(replacedCanvas.height * scale)}px`;

        substituteCanvas.style.left = `${Math.round(substitutePos.left * scale)}px`;
        substituteCanvas.style.top = `${Math.round(substitutePos.top * scale)}px`;
        substituteCanvas.style.width = `${Math.round(substituteCanvas.width * scale)}px`;
        substituteCanvas.style.height = `${Math.round(substituteCanvas.height * scale)}px`;

        signatureManager.setCanvasSignatureReplaced(replacedCanvas);
        signatureManager.setCanvasSignatureSubstitute(substituteCanvas);
        const drawSig = (canvas: HTMLCanvasElement | undefined, data?: string) => {
            if (!canvas || !data) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                // Ratio conservé, centré (audit signatures (5))
                const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                const width = img.width * scale;
                const height = img.height * scale;
                ctx.drawImage(img, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
            };
            img.src = data;
        };

        const sigs = signatureManager.signatures();
        if (sigs) {
            drawSig(replacedCanvas, sigs.replaced);
            drawSig(substituteCanvas, sigs.substitute);
        }
    }

    function removeSigsCanvases() {
        const pdfCanvas = document.getElementById("pdf-canvas") as HTMLCanvasElement | null;
        if (!pdfCanvas || !pdfCanvas.parentElement) return;
        const container = pdfCanvas.parentElement as HTMLElement;
        const canvases = container.querySelectorAll('canvas[data-sig]');
        canvases.forEach((c) => c.remove());
        signatureManager.setCanvasSignatureReplaced(undefined as unknown as HTMLCanvasElement);
        signatureManager.setCanvasSignatureSubstitute(undefined as unknown as HTMLCanvasElement);
    }


    return <div class="relative mx-auto flex flex-col gap-2 pb-2">
        <canvas id="pdf-canvas" class="w-[85vw] max-w-[600px] lg:w-[600px] md:w-full border border-slate-300 rounded-[10px] bg-white mx-auto" />
        <PDFInputsOnCanvas />
        <PDFActions changePage={pagination} />
    </div >
}