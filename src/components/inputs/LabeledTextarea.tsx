import { LABELED_INPUT_PRO } from "./LabeledInput";

export interface TextareaProps {
    onInput: (value: string) => void
    value?: string;
}

interface LabeledTextareaProps extends TextareaProps {
    id: string;
    label: string;
    placeholder?: string;
    style?: "form";
    required?: boolean;
    rows?: number;
    /** Look "pro" des dialogs : mêmes tokens que LabeledInput variant pro. */
    variant?: "pro";
}

export function LabeledTextarea(props: LabeledTextareaProps) {
    const isPro = props.variant === "pro";
    return (
        <div class="grid grid-cols-1">
            <label class={"font-[Nunito] " + (isPro ? LABELED_INPUT_PRO.label : "")} for={props.id}>{props.label}</label>
            <textarea
                class={"font-[Nunito] mt-1 block w-full py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none resize-none " + (isPro ? LABELED_INPUT_PRO.input : "")}
                id={props.id}
                name={props.id}
                placeholder={props.placeholder ? props.placeholder : ""}
                onInput={(e) => props.onInput(e.target.value)}
                value={props.value || ""}
                required={props.required}
                rows={props.rows || 4}
            />
        </div>
    );
}
