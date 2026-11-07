import { Component } from "solid-js";
import { SignatureCanvasProps } from "./types";
import { SIGNATURE_CONFIG, SIGNATURE_LABELS } from "./constants";

// Libellé de rôle au-dessus de la plaque (dérivé du type de signataire).
export const SignatureCanvas: Component<SignatureCanvasProps> = (props) => {
    return (
        <div class="space-y-1.5">
            <p class="m-0 font-[Nunito] text-[12.5px] font-bold text-slate-600">
                Signature du{props.type === "replaced" ? ` ${SIGNATURE_LABELS.REPLACED}` : ` ${SIGNATURE_LABELS.SUBSTITUTE}`}
            </p>
            <div class={SIGNATURE_CONFIG.CONTAINER_CLASSES.CANVAS}>
                <canvas
                    ref={props.canvasRef}
                    id={`${props.type}-signature`}
                    class={SIGNATURE_CONFIG.CANVAS_CLASSES.DISPLAY}
                />
                <button
                    type="button"
                    class={SIGNATURE_CONFIG.CONTAINER_CLASSES.BUTTON}
                    onClick={() => props.onEdit(props.type)}
                >
                    {SIGNATURE_LABELS.EDIT}
                </button>
            </div>
        </div>
    );
};
