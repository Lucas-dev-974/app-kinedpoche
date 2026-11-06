import { createSignal, JSX } from "solid-js";

import "./Dropdown.css";

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

  return <div class="w-full  mx-auto border border-solid border-gray-300 rounded overflow-hidden">{props.children(toggleItem, items)}</div>;
}
