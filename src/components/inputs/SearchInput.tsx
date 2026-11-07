interface SearchInputProps {
    placeholder?: string;
    onInput: (value: string) => void;
    class?: string;
    value?: string;
}

export function SearchInput(props: SearchInputProps) {
    return (
        <div class={`w-full mb-3 box-border ${props.class || ""}`}>
            <input
                type="text"
                class="m-0 box-border w-full rounded-full border border-slate-300 bg-white px-4 py-2 font-[Nunito] text-[13.5px] text-slate-700 shadow-sm duration-150 placeholder:text-slate-400 hover:border-slate-400 focus:border-[#099773] focus:outline-none focus:ring-2 focus:ring-[#099773]/25"
                placeholder={props.placeholder || "Recherche"}
                value={props.value || ""}
                onInput={(e) => props.onInput(e.currentTarget.value)}
            />
        </div>
    );
}


