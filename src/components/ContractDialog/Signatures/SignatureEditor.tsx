import SignaturePad from "signature_pad";
import { Component, createEffect, createSignal, on, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { Button } from "../../buttons/Button";
import { BottomSlideDialog } from "../../dialog/BottomSlideDialog";
import { SignatureEditorProps } from "./types";
import { SIGNATURE_CONFIG, SIGNATURE_LABELS, SIGNATURE_TITLES } from "./constants";

export const SignatureEditor: Component<SignatureEditorProps> = (props) => {
    const [canvasRef, setCanvasRef] = createSignal<HTMLCanvasElement>();
    const [signaturePad, setSignaturePad] = createSignal<SignaturePad>();
    // Vrai quand le resize final (rAF) a été appliqué — la restauration de la
    // signature existante ne doit se dessiner qu'APRÈS, sinon l'assignation
    // canvas.width/height (qui efface le bitmap) gomme le fromDataURL.
    const [canvasSized, setCanvasSized] = createSignal(false);

    const signaturePadConfig = {
        penColor: SIGNATURE_CONFIG.PEN_COLOR,
    };

    const resizeCanvasToDisplaySize = (canvas: HTMLCanvasElement | undefined) => {
        if (!canvas) return;
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        if (displayWidth === 0 || displayHeight === 0) return;
        const newWidth = Math.floor(displayWidth * ratio);
        const newHeight = Math.floor(displayHeight * ratio);
        if (canvas.width === newWidth && canvas.height === newHeight) {
            // Même taille : ne pas toucher au bitmap (l'assignation effacerait
            // la signature restaurée, audit signatures (3))
            return;
        }
        const context = canvas.getContext("2d");
        if (!context) return;
        canvas.width = newWidth;
        canvas.height = newHeight;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const handleWindowResize = () => {
        resizeCanvasToDisplaySize(canvasRef());
    };

    // Initialize/teardown on dialog open state
    createEffect(on(() => props.open, (isOpen) => {
        if (!isOpen) {
            window.removeEventListener('resize', handleWindowResize);
            setCanvasSized(false);
            return;
        }

        const drawingCanvas = canvasRef();
        resizeCanvasToDisplaySize(drawingCanvas);

        if (drawingCanvas) {
            // Effacer le bitmap d'une session précédente : le canvas survit aux
            // réouvertures (BottomSlideDialog garde ses enfants montés) — sans
            // signature existante, le pad doit partir vierge au lieu d'afficher
            // des traits fantômes re-sauvegardables.
            drawingCanvas.getContext("2d")?.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

            // Détacher le pad de la session précédente : il restait câblé sur le
            // même canvas (dessin dupliqué, audit signatures (2))
            signaturePad()?.off();
            setSignaturePad(new SignaturePad(drawingCanvas, signaturePadConfig));
        }

        requestAnimationFrame(() => {
            resizeCanvasToDisplaySize(canvasRef());
            setCanvasSized(true);
        });
        window.addEventListener('resize', handleWindowResize);

        // Audit signatures (1) : le dialog peut être démonté ouvert (bascule de
        // vue) — sans onCleanup le listener restait attaché pour toujours.
        onCleanup(() => window.removeEventListener('resize', handleWindowResize));
    }));

    // Restore existing signature AFTER the final resize (voir canvasSized)
    createEffect(() => {
        if (!canvasSized() || !props.open || !signaturePad() || !props.existingSignature) return;
        signaturePad()?.fromDataURL(props.existingSignature);
    });

    const handleClear = () => {
        signaturePad()?.clear();
    };

    const handleSave = () => {
        const pad = signaturePad();
        if (!pad) return;

        const dataURL = pad.toDataURL('image/png');
        if (!dataURL) return;

        props.onSave(dataURL);
    };

    const getTitle = () => {
        return props.selectedType === "replaced"
            ? SIGNATURE_TITLES.ADD_REPLACED
            : SIGNATURE_TITLES.ADD_SUBSTITUTE;
    };

    return (
        <Portal>
            <BottomSlideDialog
                open={props.open}
                onClose={props.onClose}
                title={getTitle()}
            >
                <div class="flex flex-col justify-between h-full px-3 pb-3 gap-2">
                    <canvas
                        id="signature-canvas"
                        ref={setCanvasRef}
                        class={SIGNATURE_CONFIG.CANVAS_CLASSES.EDITOR}
                    />

                    {/* Hiérarchie : Effacer / Annuler en secondaire, Enregistrer en primaire. */}
                    <div class="flex justify-end flex-wrap gap-2.5">
                        <button
                            type="button"
                            onClick={handleClear}
                            class="m-0 cursor-pointer rounded-[10px] border border-slate-300 bg-white px-3.5 py-2 font-[Nunito] text-[13px] font-bold text-slate-600 duration-150 hover:border-slate-400 hover:text-slate-700"
                        >
                            {SIGNATURE_LABELS.CLEAR}
                        </button>
                        <button
                            type="button"
                            onClick={props.onClose}
                            class="m-0 cursor-pointer rounded-[10px] border border-slate-300 bg-white px-3.5 py-2 font-[Nunito] text-[13px] font-bold text-slate-600 duration-150 hover:border-slate-400 hover:text-slate-700"
                        >
                            {SIGNATURE_LABELS.CANCEL}
                        </button>
                        <Button text={SIGNATURE_LABELS.SAVE} onClick={handleSave} />
                    </div>
                </div>
            </BottomSlideDialog>
        </Portal>
    );
};
