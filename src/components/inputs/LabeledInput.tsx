interface LabeledInputProps {
  id: string;
  label: string;
  type: "text" | "email" | "date" | "number" | "password" | "textarea";
  placeholder?: string;

  value?: string | Date;
  required?: boolean;

  onInput?: (e: Event & { target: any & { value: string } }) => void;
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
    <div class={"grid grid-cols-1 form-input py-1"}>
      <label class="font-[Nunito]" for={props.id}>{props.label}</label>
      <input
        ref={inputRef}
        class="border border-gray-300 rounded-lg md:py-2 px-3 bg-transparent shadow-sm focus:outline-none resize-none outline-none font-[Nunito] text-base"
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
