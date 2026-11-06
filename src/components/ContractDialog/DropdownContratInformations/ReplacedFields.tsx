import { currentPDFTool } from "../../ContractEditor/PDFEditor";
import { DorpdownItemType } from "../../Dropdown/DropdownWrapper";
import { RadioButtons } from "../../inputs/DialogToInputRadio";
import { DropdownItem } from "../../Dropdown/DropdownItem";
import { FitFieldsWithUserData } from "./FitFieldsWithUserData";
import { GenderEnum } from "../../../utils/PDFTool";
import { LabeledInput } from "../../inputs/LabeledInput";
import { UserEntity } from "../../../models/user.entity";
import storeService from "../../../utils/store.service";
import { createSignal, Show, onMount } from "solid-js";
import { formatDateForInput } from "./ContratInformationsDropdowns";
import { loadContract } from "../../../const.data";
import { triggerFill, useFillMode } from "./formFillMode";

export interface AccordionFieldsProps {
  toggleItem: ((id: number) => void) | ((id: number) => void);
  items: DorpdownItemType[] | (() => DorpdownItemType[]);
}

const [professionnalAddress, setProfessionnalAddress] = createSignal<string>("");
const [orderDepartmentNumber, setOrderDepartmentNumber] = createSignal<string>("");
const [birthdayLocation, setBirthdayLocation] = createSignal<string>("");
const [orderDepartement, setOrderDepartement] = createSignal<string>("");
const [gender, setGender] = createSignal<GenderEnum>(GenderEnum.male);
const [birthday, setBirthday] = createSignal<string>("");
const [email, setEmail] = createSignal<string>("");
const [name, setName] = createSignal<string>("");
const [valid, setValid] = createSignal<boolean>(false);

export const [isFilledWithUserReplaced, setIsFilledWithUserReplaced] = createSignal<boolean>(false);

function isValid() {
  if (name() && email() && birthday() && birthdayLocation() && orderDepartement() && orderDepartmentNumber() && professionnalAddress()) {
    setValid(true);
  } else {
    setValid(false);
  }
}

// Mapping des noms de champs UI vers les noms de champs ContractEntity
const FIELD_MAPPING: Record<string, keyof import("../../../models/contract.entity").ContractEntity> = {
  name: "replacedName",
  birthday: "replacedBirthday",
  birthdayLocation: "replacedBirthdayLocation",
  orderDepartement: "replacedOrderDepartement",
  orderDepartmentNumber: "replacedOrderDepartmentNumber",
  professionnalAddress: "replacedProfessionnalAddress",
  email: "replacedEmail",
  gender: "replacedGender",
};

function HandlerToUpdateFormInputsAndPDFInputs(
  field: "name" | "birthday" | "birthdayLocation" | "orderDepartement" | "orderDepartmentNumber" | "professionnalAddress" | "email" | "gender",
  value: string,
) {

  // Mettre à jour uniquement le signal du champ modifié au lieu de tous les champs
  // Cela évite de réinitialiser le champ en cours de modification avec une valeur obsolète
  switch (field) {
    case "name":
      setName(value);
      break;
    case "email":
      setEmail(value);
      break;
    case "birthday":
      setBirthday(value);
      break;
    case "birthdayLocation":
      setBirthdayLocation(value);
      break;
    case "orderDepartement":
      setOrderDepartement(value);
      break;
    case "orderDepartmentNumber":
      setOrderDepartmentNumber(value);
      break;
    case "professionnalAddress":
      setProfessionnalAddress(value);
      break;
    case "gender":
      setGender(value as GenderEnum);
      break;
  }

  const contractField = FIELD_MAPPING[field];
  currentPDFTool()?.updateContractDataAndPDFFields(contractField, value, gender());

  isValid();
}

export function fillWithMyInformationsReplaced() {
  // Signale au substitut de se vider
  triggerFill("replaced");

  const userDatas: UserEntity = storeService.data.user as UserEntity;
  const tool = currentPDFTool();
  if (!tool) return;

  setGender(userDatas.gender ?? GenderEnum.male);



  // Utiliser immediateContractUpdate=true pour éviter que le debounce n'annule les mises à jour précédentes
  // IMPORTANT: Mettre à jour replacedName en premier pour s'assurer qu'il est bien dans le store
  HandlerToUpdateFormInputsAndPDFInputs("name", userDatas.fullname);
  HandlerToUpdateFormInputsAndPDFInputs("email", userDatas.email);
  // Formater la date correctement pour l'input de type "date" (YYYY-MM-DD)
  const formattedBirthday = formatDateForInput(userDatas.birthday instanceof Date ? userDatas.birthday.toISOString() : userDatas.birthday);
  HandlerToUpdateFormInputsAndPDFInputs("birthday", formattedBirthday);
  HandlerToUpdateFormInputsAndPDFInputs("birthdayLocation", userDatas.bornLocation);
  HandlerToUpdateFormInputsAndPDFInputs("orderDepartement", userDatas.department);
  HandlerToUpdateFormInputsAndPDFInputs("orderDepartmentNumber", userDatas.orderNumber ? userDatas.orderNumber.toString() : "");
  HandlerToUpdateFormInputsAndPDFInputs("professionnalAddress", userDatas.officeAdress as string);

  setIsFilledWithUserReplaced(true);
}

export function removeMyInformationsReplaced() {
  clearReplacedFields();
  setIsFilledWithUserReplaced(false);
}

export function handlerToUpdateFormInputsWithContratData() {
  setGender(currentPDFTool()?.contractData.replacedGender ?? GenderEnum.male);
  setEmail(currentPDFTool()?.contractData.replacedEmail!);
  setName(currentPDFTool()?.contractData.replacedName!);
  setBirthday(formatDateForInput(currentPDFTool()?.contractData.replacedBirthday!))
  setBirthdayLocation(currentPDFTool()?.contractData.replacedBirthdayLocation!);
  setOrderDepartement(currentPDFTool()?.contractData.replacedOrderDepartement!);
  setOrderDepartmentNumber(currentPDFTool()?.contractData.replacedOrderDepartmentNumber?.toString()!);
  setProfessionnalAddress(currentPDFTool()?.contractData.replacedProfessionnalAddress!);
}

export function ReplacedFields(props: AccordionFieldsProps) {
  onMount(() => {
    if (loadContract()) {
      handlerToUpdateFormInputsWithContratData()
    } else {
      setGender(GenderEnum.male);
      setEmail("");
      setName("");
      setBirthday("")
      setBirthdayLocation("");
      setOrderDepartement("");
      setOrderDepartmentNumber("");
      setProfessionnalAddress("");
    }
    isValid()
  })

  // Écoute le mode de remplissage : si le substitut est rempli, on vide le remplacé
  useFillMode("substitute", () => {
    clearReplacedFields();
    setIsFilledWithUserReplaced(false);
  });


  return (
    <DropdownItem
      id={1}
      title="Le remplacé"
      toggle={props.toggleItem}
      isOpen={
        (typeof props.items === "function" ? props.items() : props.items).find(
          (i: { id: number }) => i.id === 1
        )?.isOpen ?? false
      }
      valid={valid()}
    >
      <Show when={storeService.data.user?.email !== ""}>
        <div class="flex w-full justify-end">
          <FitFieldsWithUserData
            onFill={fillWithMyInformationsReplaced}
            onClear={removeMyInformationsReplaced}
            isFilled={isFilledWithUserReplaced()}
          />
        </div>
      </Show>

      <RadioButtons
        legend="Genre"
        name="replaced-gender"
        items={[
          {
            id: "replaced-mister",
            text: "Monsieur",
            value: GenderEnum.male,
          },
          {
            id: "replaced-miss",
            text: "Madame",
            value: GenderEnum.female,
          },
        ]}
        onChange={(e) => {
          const target = e.target as HTMLInputElement;
          const newGender = target.value as GenderEnum;
          HandlerToUpdateFormInputsAndPDFInputs("gender", newGender);
        }}
        value={gender()}
      />

      <LabeledInput
        id="replaced-name"
        label="Nom, prénom"
        type="text"
        onInput={(e) => {
          HandlerToUpdateFormInputsAndPDFInputs("name", e.target.value);
        }}
        value={name()}
      />
      <LabeledInput
        id="replaced-mail"
        label="Email"
        type="text"
        onInput={(e) => {
          HandlerToUpdateFormInputsAndPDFInputs("email", e.target.value);
        }}
        value={email()}
      />
      <LabeledInput
        id="birthday"
        label="Née le"
        type="date"
        onInput={(e) => {
          HandlerToUpdateFormInputsAndPDFInputs("birthday", e.target.value);
        }}
        value={birthday()}
      />
      <LabeledInput
        id="birthday-location"
        label="Née à"
        type="text"
        onInput={(e) => {
          HandlerToUpdateFormInputsAndPDFInputs("birthdayLocation", e.target.value);

        }}
        value={birthdayLocation()}
      />
      <LabeledInput
        id="department-order"
        label="Département d'ordre"
        type="text"
        onInput={(e) => {
          HandlerToUpdateFormInputsAndPDFInputs("orderDepartement", e.target.value);

        }}
        value={orderDepartement()}
      />
      <LabeledInput
        id="department-number-order"
        label="Numéro d'ordre"
        type="text"
        onInput={(e) => {
          HandlerToUpdateFormInputsAndPDFInputs("orderDepartmentNumber", e.target.value);

        }}
        value={orderDepartmentNumber()}
      />
      <LabeledInput
        id="professional-address"
        label="Adresse profesionnel"
        type="text"
        onInput={(e) => {
          HandlerToUpdateFormInputsAndPDFInputs("professionnalAddress", e.target.value);

        }}
        value={professionnalAddress()}
      />
    </DropdownItem>
  );
}

function clearReplacedFields() {
  // Remettre les valeurs par défaut
  setGender(GenderEnum.male);
  HandlerToUpdateFormInputsAndPDFInputs("gender", GenderEnum.male);
  HandlerToUpdateFormInputsAndPDFInputs("name", "");
  HandlerToUpdateFormInputsAndPDFInputs("email", "");
  HandlerToUpdateFormInputsAndPDFInputs("birthday", "");
  HandlerToUpdateFormInputsAndPDFInputs("birthdayLocation", "");
  HandlerToUpdateFormInputsAndPDFInputs("orderDepartement", "");
  HandlerToUpdateFormInputsAndPDFInputs("orderDepartmentNumber", "");
  HandlerToUpdateFormInputsAndPDFInputs("professionnalAddress", "");
}
