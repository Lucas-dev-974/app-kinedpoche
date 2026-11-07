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
}

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

  return (
    <div class={props.wrapperClass ?? "grid grid-cols-1 form-input py-1"}>
      <label class={"font-[Nunito] " + (props.labelClass ?? "")} for={props.id}>{props.label}</label>
      <input
        ref={inputRef}
        class={"border border-gray-300 rounded-lg md:py-2 px-3 bg-transparent shadow-sm focus:outline-none resize-none outline-none font-[Nunito] text-base " + (props.inputClass ?? "")}
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
