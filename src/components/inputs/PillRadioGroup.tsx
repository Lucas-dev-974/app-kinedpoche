interface PillRadioGroupProps {
  name: string;
  items: {
    id: string;
    text: string;
    value: string;
  }[];
  value: string;
  onChange: (value: string) => void;
}

// Pills segmentées : radios natifs masqués (sémantique a11y conservée), même
// look que les tokens "pro" de LabeledInput. Utilisé par le dialog contrat
// (genre des deux kinés) et « Mes informations ».
export function PillRadioGroup(props: PillRadioGroupProps) {
  return (
    <fieldset class="m-0 flex flex-wrap gap-2 border-none p-0">
      {props.items.map((item) => (
        <label
          for={item.id}
          classList={{
            "m-0 flex cursor-pointer select-none items-center rounded-full border px-4 py-1.5 font-[Nunito] text-[12.5px] font-bold duration-150": true,
            "border-transparent bg-[#099773] text-white shadow-sm": props.value === item.value,
            "border-slate-300 bg-white text-slate-600 hover:border-[#099773]/70 hover:text-[#099773]": props.value !== item.value,
          }}
        >
          <input
            type="radio"
            id={item.id}
            name={props.name}
            class="sr-only"
            value={item.value}
            checked={props.value === item.value}
            onChange={() => props.onChange(item.value)}
          />
          {item.text}
        </label>
      ))}
    </fieldset>
  );
}
