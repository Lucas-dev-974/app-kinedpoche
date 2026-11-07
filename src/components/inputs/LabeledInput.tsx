interface LabeledInputProps {
  id: string;
  label: string;
  type: "text" | "email" | "date" | "number" | "password" | "textarea";
  placeholder?: string;

  value?: string | Date;
  required?: boolean;

  onInput?: (e: Event & { target: any & { value: string } }) => void;

  /** Classes additives (look pro des dialogs form) : s'ajoutent aux défauts. */
  labelClass?: string;
  inputClass?: string;
  /** Classes du wrapper : REMPLACENT "grid grid-cols-1 form-input py-1". */
  wrapperClass?: string;
  /** Look "pro" des dialogs (libellé 12.5px, input blanc focus vert) :
      s'applique sauf si labelClass/inputClass/wrapperClass sont fournis. */
  variant?: "pro";
}

// Tokens du look pro — réutilisés par les labels nus (ex: "Genre" des pills).
export const LABELED_INPUT_PRO = {
  label: "font-[Nunito] text-[12.5px] font-bold text-slate-600 mb-1",
  input: "w-full box-border rounded-[10px] border-slate-300 bg-white px-3 py-2 text-[14px] text-slate-800 shadow-sm duration-150 hover:border-slate-400 focus:border-[#099773] focus:outline-none focus:ring-2 focus:ring-[#099773]/25",
  wrapper: "grid grid-cols-1 py-0",
} as const;

export function LabeledInput(props: LabeledInputProps) {
  let inputRef: HTMLInputElement | undefined;

  function getValue() {
    if (typeof props.value === "string") {
      return props.value;
    } else if (props.value == undefined || props.value == null) {
      return "";
    } else {
      return props.value
    }
  }

  const isPro = props.variant === "pro";

  return (
    <div class={props.wrapperClass ?? (isPro ? LABELED_INPUT_PRO.wrapper : "grid grid-cols-1 form-input py-1")}>
      <label class={"font-[Nunito] " + (props.labelClass ?? (isPro ? LABELED_INPUT_PRO.label : ""))} for={props.id}>{props.label}</label>
      <input
        ref={inputRef}
        class={"border border-gray-300 rounded-lg md:py-2 px-3 bg-transparent shadow-sm focus:outline-none resize-none outline-none font-[Nunito] text-base " + (props.inputClass ?? (isPro ? LABELED_INPUT_PRO.input : ""))}
        type={props.type}
        id={props.id}
        name={props.id}
        placeholder={props.placeholder ? props.placeholder : ""}
        onInput={(e) => props.onInput && props.onInput(e)}
        value={getValue() as string}
        required={props.required}
      />
    </div>
  );
}
