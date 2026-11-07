import { createSignal, onCleanup } from "solid-js"
import { currentPDFTool } from "./PDFEditor"
import { PDFFields } from "../../utils/PDFTool";
import { formatDate } from "../../utils/formatDate";
import { DATE_FIELD_IDS, A4_PDF_DIMENSIONS } from "../../utils/pdf-field-mapping.config";

export const [canvasInputs, setCanvasInputs] = createSignal<PDFFields[]>([]);

export function PDFInputsOnCanvas() {
    onCleanup(() => setCanvasInputs([]))

    function parseDisplayData(fields: PDFFields): string {
        if (DATE_FIELD_IDS.has(fields.id)) {
            // formatDate retourne '' pour une date illisible : afficher la valeur
            // brute au lieu de la faire disparaître (audit 🟠)
            return formatDate(fields.value) || (fields.value ?? "")
        }
        return fields.value ?? ""
    }


    function getFontSize() {
        if (window.innerWidth < 768) {
            return 10
        } else {
            return 14
        }
    }

    // Recalculate positions based on current canvas size
    function getAdjustedPosition(field: PDFFields) {
        const canvas = document.getElementById("pdf-canvas") as HTMLCanvasElement | null;
        if (!canvas || !currentPDFTool()) {
            return {
                left: field.left,
                top: field.top,
                width: field.width,
                height: field.height
            };
        }

        // Get current canvas display width and position
        const currentCanvasWidth = canvas.clientWidth;
        const canvasOffsetLeft = canvas.offsetLeft;
        const canvasOffsetTop = canvas.offsetTop;

        const pdfTool = currentPDFTool()!;
        if (!pdfTool.pdfDoc || !field.rect || field.rect.length < 4) {
            // Fallback: use stored positions with a simple scale ratio
            // Try to estimate scale based on canvas width
            // Assuming original was calculated with ~600px width
            const estimatedOriginalWidth = 600;
            const scaleRatio = currentCanvasWidth / estimatedOriginalWidth;

            return {
                left: (field.left * scaleRatio) + canvasOffsetLeft,
                top: (field.top * scaleRatio) + canvasOffsetTop,
                width: field.width * scaleRatio,
                height: field.height * scaleRatio
            };
        }

        // Recalculate from PDF coordinates (field.rect contains [x0, y0, x2, y2])
        // This matches the calculation in PDFTool.getPagesFields()
        const pdfWidth = A4_PDF_DIMENSIONS.width; // Standard A4 width in points
        const pdfHeight = A4_PDF_DIMENSIONS.height; // Standard A4 height in points
        const scale = currentCanvasWidth / pdfWidth;

        const [x0, y0, x2, y2] = field.rect;

        // Calculate viewport height (same as in PDFTool)
        const viewportHeight = pdfHeight * scale;

        // Recalculate positions exactly as done in PDFTool.getPagesFields()
        const adjustedLeft = x0 * scale;
        const adjustedTop = viewportHeight - (y2 * scale);
        const adjustedWidth = (x2 - x0) * scale;
        const adjustedHeight = (y2 - y0) * scale;

        return {
            left: adjustedLeft + canvasOffsetLeft,
            top: adjustedTop + canvasOffsetTop,
            width: adjustedWidth,
            height: adjustedHeight
        };
    }

    return <div class="text-xs md:text-sm lg:text-base">
        {canvasInputs().map((field) => {
            const position = getAdjustedPosition(field);
            return (
                <input
                    class={" border-none inset-0 overflow-visible outline-none"}
                    type="text"
                    value={parseDisplayData(field)}
                    onInput={(e) => currentPDFTool()!.updateContractDataAndPDFFields(field.id, e.target.value)}
                    style={{
                        "font-size": `${getFontSize()}px`,
                        position: "absolute",
                        left: `${position.left}px`,
                        top: `${position.top}px`,
                        width: `${position.width}px`,
                        height: `${position.height}px`,
                    }}
                />
            );
        })}
    </div>
}