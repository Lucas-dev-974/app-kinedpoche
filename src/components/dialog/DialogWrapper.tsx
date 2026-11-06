import { createEffect, createSignal, JSX, Match, Show, Switch } from "solid-js";
import { setCurrentPDFTool } from "../ContractEditor/PDFEditor";
import { PDFTool } from "../../utils/PDFTool";

import { setLoadContrat, setSigneBack } from "../../const.data";
import { OutlinedButton } from "../buttons/OulinedButton";
import { Overlay } from "./Overlay";
import { DialogContainer } from "./dialog-components/DialogContainer";
import { DialgoHeader } from "./dialog-components/DialgoHeader";

interface DialogWrapperProps {
  children: JSX.Element;
  name: string;
  btnText: string;
  title: string;
  isInNavbar?: boolean;
  /**
   * When provided, the dialog becomes controlled from the outside.
   */
  isOpen?: boolean;
  /**
   * Optional external close handler used when `isOpen` is controlled.
   */
  onClose?: () => void;
  /**
   * Hide the trigger button and only render the dialog content.
   */
  hideTriggerButton?: boolean;
}

export const DIALOG_NAMES = {
  none: "none",
  registerInformations: "registerInformations",
  editContract: "editContract",
} as const;


const [openDialogs, setOpenDialogs] = createSignal<string>(DIALOG_NAMES.none);
const [closeDialog, setCloseDialog] = createSignal<string>(DIALOG_NAMES.none);

export const openDialogTool = (dialog: string) => {
  setOpenDialogs(dialog);
};

export const closeDialogTool = (dialog: string) => {
  setCloseDialog(dialog);
};

export function DialogWrapper(props: DialogWrapperProps) {
  const [internalIsOpen, setInternalIsOpen] = createSignal(false);

  const isControlled = () => props.isOpen !== undefined;
  const isOpen = () => (isControlled() ? !!props.isOpen : internalIsOpen());

  const setOpen = (value: boolean) => {
    if (!isControlled()) {
      setInternalIsOpen(value);
    } else if (!value && props.onClose) {
      props.onClose();
    }
  };

  function removeSigneBackQuery() {
    const queryParams = new URLSearchParams(window.location.search);
    queryParams.delete("signe-back");
    const query = queryParams.toString();
    // Pas de `?` orphelin quand la query devient vide (audit 🟡)
    window.history.replaceState({}, "", window.location.pathname + (query ? "?" + query : ""));
  }

  async function closeDialogTool() {
    setOpenDialogs(DIALOG_NAMES.none);

    // Resets destructifs scopés au dialog PDF : ils ne doivent pas tourner à la
    // fermeture des autres dialogs (audit 🟠 DialogWrapper).
    if (props.name === DIALOG_NAMES.editContract) {
      setLoadContrat(undefined);
      setSigneBack(false);
      // F1 : détruire le singleton — setCurrentPDFTool(undefined) seul laisse
      // PDFTool.instance en vie avec le contractData du contrat/patient précédent.
      PDFTool.resetInstance();
      setCurrentPDFTool(undefined);
      removeSigneBackQuery();
    }

    setOpen(false);
    // Neutraliser le signal de fermeture après traitement : sinon la valeur
    // restait figée (ex: 'registerInformations') et l'instance, montée en
    // permanence dans la Navbar, ré-exécutait son reset à CHAQUE changement
    // d'openDialogs → dialog ouvert puis refermé instantanément, editContract
    // écrasé pendant son ouverture, "nouveau contrat" au lieu de mise à jour.
    setCloseDialog(DIALOG_NAMES.none);
  };

  createEffect(() => {
    openDialogs() === props.name ? setOpen(true) : null;
    closeDialog() === props.name ? closeDialogTool() : null;
  });

  return (
    <>
      <Show when={!props.hideTriggerButton}>
        <Switch>
          <Match when={!props.isInNavbar}>
            <OutlinedButton text={props.btnText} onClick={() => setOpen(true)} class="w-full" />
          </Match>

          <Match when={props.isInNavbar}>
            <button
              onClick={() => setOpen(true)}
              class={
                "flex flex-col items-center justify-center" +
                " font-[Nunito] text-sm  px-4 py-2 rounded-lg cursor-pointer duration-200 " +
                " bg-transparent border-none text-white shadow-none hover:shadow-none "
              }
            >
              {props.btnText}
            </button>
          </Match>
        </Switch>
      </Show>
      <Show when={isOpen()} fallback={null}>
        <Overlay onClick={closeDialogTool} show={isOpen()} />
        <DialogContainer>
          <DialgoHeader title={props.title} onClose={closeDialogTool} />
          <div class="overflow-y-auto py-5 px-4" style={{ "-webkit-overflow-scrolling": "touch" }}>
            {props.children}
          </div>
        </DialogContainer>
      </Show>
    </>
  );
}
