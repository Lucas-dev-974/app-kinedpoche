import { currentPDFTool } from "../../ContractEditor/PDFEditor";
import { DorpdownItemType } from "../../Dropdown/DropdownWrapper";
import { RadioButtons } from "../../inputs/DialogToInputRadio";
import { DropdownItem } from "../../Dropdown/DropdownItem";
import { FitFieldsWithUserData } from "./FitFieldsWithUserData";
import { GenderEnum } from "../../../utils/PDFTool";
import { UserEntity } from "../../../models/user.entity";
import { LabeledInput } from "../../inputs/LabeledInput";
import storeService from "../../../utils/store.service";
import { formatDateForInput } from "./ContratInformationsDropdowns";
import { createSignal, onMount, Show } from "solid-js";
import { loadContract } from "../../../const.data";
import { triggerFill, useFillMode } from "./formFillMode";

interface AccordionFieldsProps {
  toggleItem: ((id: number) => void) | ((id: number) => void);
  items: DorpdownItemType[] | (() => DorpdownItemType[]);
}

// ------------ Input fields signals ------------
const [professionnalAddress, setProfessionnalAddress] = createSignal<string>("");
const [orderDepartmentNumber, setOrderDepartmentNumber] = createSignal<string>("");
const [birthdayLocation, setBirthdayLocation] = createSignal<string>("");
const [orderDepartement, setOrderDepartement] = createSignal<string>("");
const [birthday, setBirthday] = createSignal<string>("");
const [email, setEmail] = createSignal<string>("");
const [name, setName] = createSignal<string>("");
const [gender, setGender] = createSignal<GenderEnum>(GenderEnum.male);
const [valid, setValid] = createSignal<boolean>(false);

export const [isFilledWithUserSubstitute, setIsFilledWithUserSubstitute] = createSignal<boolean>(false);


function isValid() {
  if (name() && email() && birthday() && birthdayLocation() && orderDepartement() && orderDepartmentNumber() && professionnalAddress()) {
    setValid(true);
  } else {
    setValid(false);
  }
}

// Mapping des noms de champs UI vers les noms de champs ContractEntity
const FIELD_MAPPING: Record<string, keyof import("../../../models/contract.entity").ContractEntity> = {
  name: "substituteName",
  birthday: "substituteBirthday",
  birthdayLocation: "substituteBirthdayLocation",
  orderDepartement: "substituteOrderDepartement",
  orderDepartmentNumber: "substituteOrderDepartmentNumber",
  address: "substituteAdress",
  email: "substituteEmail",
  gender: "substituteGender",
};

function HandlerToUpdateFormInputsAndPDFInputs(
  field: | "name" | "birthday" | "birthdayLocation" | "orderDepartement" | "orderDepartmentNumber" | "address" | "email" | "gender",
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
    case "address":
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

export function fillWithMyInformationsSubstitute() {
  // Signale au remplacé de se vider
  triggerFill("substitute");

  const userDatas: UserEntity = storeService.data.user! as UserEntity;
  const tool = currentPDFTool();
  if (!tool) return;

  // Récupérer le genre depuis le store réactif (pas depuis contractData qui peut être désynchronisé)
  const contractDataFromStore = tool.getContractData();
  const currentGender = contractDataFromStore.substituteGender ?? GenderEnum.male;
  setGender(currentGender);

  // S'assurer que substituteGender est défini dans le store
  if (!contractDataFromStore.substituteGender) {
    tool.updateField("substituteGender", currentGender);
  }

  // Utiliser immediateContractUpdate=true pour éviter que le debounce n'annule les mises à jour précédentes
  // IMPORTANT: Mettre à jour substituteName en premier pour s'assurer qu'il est bien dans le store
  HandlerToUpdateFormInputsAndPDFInputs("name", userDatas.fullname);
  HandlerToUpdateFormInputsAndPDFInputs("email", userDatas.email);
  // Formater la date correctement pour l'input de type "date" (YYYY-MM-DD)
  const formattedBirthday = formatDateForInput(userDatas.birthday instanceof Date ? userDatas.birthday.toISOString() : userDatas.birthday);
  HandlerToUpdateFormInputsAndPDFInputs("birthday", formattedBirthday);
  HandlerToUpdateFormInputsAndPDFInputs("birthdayLocation", userDatas.bornLocation);
  HandlerToUpdateFormInputsAndPDFInputs("orderDepartement", userDatas.department);
  HandlerToUpdateFormInputsAndPDFInputs("orderDepartmentNumber", userDatas.orderNumber ? userDatas.orderNumber.toString() : "");
  HandlerToUpdateFormInputsAndPDFInputs("address", userDatas.personalAdress);

  setIsFilledWithUserSubstitute(true);
}

export function removeMyInformationsSubstitute() {
  clearSubstituteFields();
  setIsFilledWithUserSubstitute(false);
}

export function handlerToUpdateFormInputsWithContratData() {
  setGender(currentPDFTool()?.contractData.substituteGender ?? GenderEnum.male);
  setEmail(currentPDFTool()?.contractData.substituteEmail!);
  setName(currentPDFTool()?.contractData.substituteName!);
  setBirthday(formatDateForInput(currentPDFTool()?.contractData.substituteBirthday!));
  setBirthdayLocation(currentPDFTool()?.contractData.substituteBirthdayLocation!);
  setOrderDepartement(currentPDFTool()?.contractData.substituteOrderDepartement!);
  setOrderDepartmentNumber(currentPDFTool()?.contractData.substituteOrderDepartmentNumber?.toString()!);
  setProfessionnalAddress(currentPDFTool()?.contractData.substituteAdress!);
}

export function SubstituteFields(props: AccordionFieldsProps) {
  onMount(() => {
    if (loadContract()) {
      handlerToUpdateFormInputsWithContratData()
    } else {
      setGender(GenderEnum.male);
      setEmail("");
      setName("");
      setBirthday("");
      setBirthdayLocation("");
      setOrderDepartement("");
      setOrderDepartmentNumber("");
      setProfessionnalAddress("");
    }
    isValid()
  })

  // Écoute le mode de remplissage : si le remplacé est rempli, on vide le substitut
  useFillMode("replaced", () => {
    clearSubstituteFields();
    setIsFilledWithUserSubstitute(false);
  });

  return (
    <DropdownItem
      id={2}
      title="Le remplacant"
      toggle={props.toggleItem}
      isOpen={(typeof props.items === "function" ? props.items() : props.items).find((i) => i.id === 2)?.isOpen}
      valid={valid()}
    >

      <Show when={storeService.data.user!.email !== ""}>
        <div class="flex w-full justify-end">
          <FitFieldsWithUserData
            onFill={fillWithMyInformationsSubstitute}
            onClear={removeMyInformationsSubstitute}
            isFilled={isFilledWithUserSubstitute()}
          />
        </div>
      </Show>

      <RadioButtons
        legend="Genre"
        name="substitute-gender"
        items={[
          {
            id: "substitute-mister",
            text: "Monsieur",
            value: GenderEnum.male,
          },
          {
            id: "substitute-miss",
            text: "Madame",
            value: GenderEnum.female,
          },
        ]}
        onChange={(e) => {
          const target = e.target as HTMLInputElement;
          const newGender = target.value as GenderEnum;
          HandlerToUpdateFormInputsAndPDFInputs("gender", newGender);
        }}
        value={gender() as GenderEnum}
      />
      <LabeledInput
        id="substitute-name"
        label="Nom, prénom"
        type="text"
        onInput={(e) => { HandlerToUpdateFormInputsAndPDFInputs("name", e.target.value); isValid() }}
        value={name()}
      />
      <LabeledInput
        id="substitute-mail"
        label="Email"
        type="text"
        onInput={(e) => HandlerToUpdateFormInputsAndPDFInputs("email", e.target.value)}
        value={email()}
      />
      <LabeledInput
        id="substitute-birthday"
        label="Née le"
        type="date"
        onInput={(e) => HandlerToUpdateFormInputsAndPDFInputs("birthday", e.target.value)}
        value={birthday()}
      />
      <LabeledInput
        id="substitute-birthday-location"
        label="Née à"
        type="text"
        onInput={(e) => HandlerToUpdateFormInputsAndPDFInputs("birthdayLocation", e.target.value)}
        value={birthdayLocation()}
      />
      <LabeledInput
        id="department-order"
        label="Département d'ordre"
        type="text"
        onInput={(e) => HandlerToUpdateFormInputsAndPDFInputs("orderDepartement", e.target.value)}
        value={orderDepartement()}
      />
      <LabeledInput
        id="department-number-order"
        label="Numéro d'ordre"
        type="number"
        onInput={(e) => HandlerToUpdateFormInputsAndPDFInputs("orderDepartmentNumber", e.target.value)}
        value={orderDepartmentNumber()}
      />
      <LabeledInput
        id="substitute-address"
        label="Adresse"
        type="text"
        onInput={(e) => HandlerToUpdateFormInputsAndPDFInputs("address", e.target.value)}
        value={professionnalAddress()}
      />
    </DropdownItem>
  );
}

function clearSubstituteFields() {
  setGender(GenderEnum.male);
  HandlerToUpdateFormInputsAndPDFInputs("gender", GenderEnum.male);
  HandlerToUpdateFormInputsAndPDFInputs("name", "");
  HandlerToUpdateFormInputsAndPDFInputs("email", "");
  HandlerToUpdateFormInputsAndPDFInputs("birthday", "");
  HandlerToUpdateFormInputsAndPDFInputs("birthdayLocation", "");
  HandlerToUpdateFormInputsAndPDFInputs("orderDepartement", "");
  HandlerToUpdateFormInputsAndPDFInputs("orderDepartmentNumber", "");
  HandlerToUpdateFormInputsAndPDFInputs("address", "");
}
