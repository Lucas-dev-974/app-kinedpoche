import { Component } from "solid-js";
import { SignatureCanvasProps } from "./types";
import { SIGNATURE_CONFIG, SIGNATURE_LABELS } from "./constants";

export const SignatureCanvas: Component<SignatureCanvasProps> = (props) => {
    return (
        <div
            class={SIGNATURE_CONFIG.CONTAINER_CLASSES.CANVAS}
        >
            <canvas
                ref={props.canvasRef}
                id={`${props.type}-signature`}
                class={SIGNATURE_CONFIG.CANVAS_CLASSES.DISPLAY}
            />
            <button
                class={SIGNATURE_CONFIG.CONTAINER_CLASSES.BUTTON}
                onClick={() => props.onEdit(props.type)}
            >
                {SIGNATURE_LABELS.EDIT}
            </button>
        </div>
    );
};
