import { FaRegularCircleCheck } from 'solid-icons/fa'
import { HiOutlineChevronDown } from 'solid-icons/hi'
import { IoCloseCircleOutline } from 'solid-icons/io'
import { Show } from 'solid-js';

type DropdownItemProps = {
  id: number;
  toggle: (id: number) => void;
  isOpen?: boolean;
  title: string;
  valid?: boolean;
};

export function DropdownItem(props: DropdownItemProps & { children?: any }) {
  return (
    <div class="border-b border-slate-100 last:border-b-0">
      {/* En-tête : puce numérotée (id 1-4) + titre + état de complétude +
          chevron rotatif. Blanc au repos, hover discret. */}
      <button
        type="button"
        aria-expanded={props.isOpen ?? false}
        onClick={() => props.toggle(props.id)}
        class="m-0 flex min-h-[48px] w-full cursor-pointer items-center gap-3 border-none bg-transparent px-4 py-3 text-left font-[Nunito] duration-150 hover:bg-slate-50"
      >
        <span class="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[7px] bg-[#099773]/10 text-[11px] font-bold text-[#099773]">
          {props.id}
        </span>
        <span class="min-w-0 flex-1 truncate text-[13.5px] font-bold text-slate-700">{props.title}</span>
        <Show
          when={props.valid}
          fallback={<IoCloseCircleOutline size={17} color="#cbd5e1" />}
        >
          <FaRegularCircleCheck size={17} color="#099773" />
        </Show>
        <span
          class="flex flex-none items-center text-slate-400 duration-200"
          classList={{ "rotate-180": props.isOpen ?? false }}
        >
          <HiOutlineChevronDown size={16} />
        </span>
      </button>
      {props.isOpen && <div class="bg-white px-4 py-4">{props.children}</div>}
    </div>
  );
}
