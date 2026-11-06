import { createEffect, createSignal } from "solid-js";
import { SignatureData, SignatureType } from "./types";

class SignatureManager {
    private _canvasSignatureSubstitute = createSignal<HTMLCanvasElement>();
    private _canvasSignatureReplaced = createSignal<HTMLCanvasElement>();
    private _signatures = createSignal<SignatureData>();

    constructor() {
        // Draw signatures on target canvases when signatures state changes
        createEffect(() => {
            const sigs = this._signatures[0]();
            if (!sigs) return;

            if (sigs.replaced) {
                this.drawSignatureOnCanvas(this._canvasSignatureReplaced[0](), sigs.replaced);
            }

            if (sigs.substitute) {
                this.drawSignatureOnCanvas(this._canvasSignatureSubstitute[0](), sigs.substitute);
            }
        });
    }

    private drawSignatureOnCanvas = (canvas: HTMLCanvasElement | undefined, signatureData: string) => {
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Étirer sans conserver le ratio déformait les signatures (audit
            // signatures (5)) — ajustement à la taille, centré.
            const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
            const width = img.width * scale;
            const height = img.height * scale;
            ctx.drawImage(img, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
        };
        img.src = signatureData;
    };

    updateSignature = (type: SignatureType, signatureData: string) => {
        const currentSignatures = this._signatures[0]() || {};
        const newSignatures = { ...currentSignatures, [type]: signatureData };
        this._signatures[1](newSignatures);
    };

    // Getters pour les signaux
    get canvasSignatureSubstitute() {
        return this._canvasSignatureSubstitute[0];
    }

    get setCanvasSignatureSubstitute() {
        return this._canvasSignatureSubstitute[1];
    }

    get canvasSignatureReplaced() {
        return this._canvasSignatureReplaced[0];
    }

    get setCanvasSignatureReplaced() {
        return this._canvasSignatureReplaced[1];
    }

    get signatures() {
        return this._signatures[0];
    }

    get setSignatures() {
        return this._signatures[1];
    }

    getSignatureInstance(): SignatureManager {
        return this;
    }
}

// Instance singleton privée
let signatureManagerInstance: SignatureManager | null = null;

// Fonction pour obtenir l'instance singleton
function getSignatureManagerInstance(): SignatureManager {
    if (!signatureManagerInstance) {
        signatureManagerInstance = new SignatureManager();
    }
    return signatureManagerInstance;
}

// Constante exportée qui utilise le vrai singleton
export const signatureManager = getSignatureManagerInstance();

