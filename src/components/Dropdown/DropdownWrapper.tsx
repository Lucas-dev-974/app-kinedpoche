import { createSignal, JSX } from "solid-js";

type AccordionWrapperProps = {
  multiple?: boolean; // Permet plusieurs panneaux ouverts simultanément
  /**
   * Config explicite des panneaux — remplace l'introspection des children qui
   * instancait CHAQUE enfant une première fois juste pour les compter (onMount
   * / effets exécutés en double, audit 🟠).
   */
  itemsConfig: DorpdownItemType[];
  children: (
    toggleItem: (id: number) => void,
    items: () => DorpdownItemType[]
  ) => JSX.Element;
};

export type DorpdownItemType = {
  id: number;
  isOpen: boolean;
};

export function DropdownWrapper(
  props: AccordionWrapperProps
) {
  const [items, setItems] = createSignal<DorpdownItemType[]>(
    props.itemsConfig.map(({ id }) => ({ id, isOpen: false }))
  );

  function toggleItem(id: number) {
    setItems((prevItems) => {
      return props.multiple
        ? prevItems.map((item) =>
          item.id === id ? { ...item, isOpen: !item.isOpen } : item
        )
        : prevItems.map((item) => ({
          ...item,
          isOpen: item.id === id ? !item.isOpen : false,
        }));
    });
  }

  return (
    // Wrapper neutre : carte blanche arrondie à ring fin ; chaque DropdownItem
    // dessine son propre séparateur.
    <div class="w-full mx-auto overflow-hidden rounded-[14px] bg-white ring-1 ring-slate-200">
      {props.children(toggleItem, items)}
    </div>
  );
}
