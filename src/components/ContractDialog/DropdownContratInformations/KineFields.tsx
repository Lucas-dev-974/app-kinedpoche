import { currentPDFTool } from "../../ContractEditor/PDFEditor";
import { DorpdownItemType } from "../../Dropdown/DropdownWrapper";
import { RadioButtons } from "../../inputs/DialogToInputRadio";
import { DropdownItem } from "../../Dropdown/DropdownItem";
import { FitFieldsWithUserData } from "./FitFieldsWithUserData";
import { GenderEnum } from "../../../utils/PDFTool";
import { LabeledInput } from "../../inputs/LabeledInput";
import { UserEntity } from "../../../models/user.entity";
import { ContractEntity } from "../../../models/contract.entity";
import storeService from "../../../utils/store.service";
import { createSignal, onMount, Show } from "solid-js";
import { formatDateForInput } from "./ContratInformationsDropdowns";
import { loadContract } from "../../../const.data";
import { triggerFill, useFillMode } from "./formFillMode";

/**
 * Fusion de ReplacedFields.tsx / SubstituteFields.tsx (audit propreté 07/11 :
 * ~95 % de duplication, 286 + 270 lignes). Un seul composant paramétré par rôle,
 * comportement de chaque rôle préservé à l'identique (divergences commentées).
 */

export type KineRole = "replaced" | "substitute";

export interface AccordionFieldsProps {
  toggleItem: (id: number) => void;
  items: DorpdownItemType[] | (() => DorpdownItemType[]);
}

type UiField =
  | "name"
  | "birthday"
  | "birthdayLocation"
  | "orderDepartement"
  | "orderDepartmentNumber"
  | "address"
  | "email"
  | "gender";

type RoleConfig = {
  /** id de l'accordéon dans DropdownWrapper (1=remplacé, 2=remplaçant) */
  accordionId: number;
  title: string;
  /** Champ du contrat par champ UI (les préfixes replaced…/substitute… sont hétérogènes côté entité) */
  fields: Record<UiField, keyof ContractEntity>;
  /** Champ du profil utilisé par « Remplir avec mes informations » */
  addressUserField: "officeAdress" | "personalAdress";
  addressLabel: string;
  /** Type de l'input « Numéro d'ordre » (historique : text pour le remplacé, number pour le remplaçant) */
  orderNumberInputType: "text" | "number";
};

const ROLE_CONFIG: Record<KineRole, RoleConfig> = {
  replaced: {
    accordionId: 1,
    title: "Le remplacé",
    fields: {
      name: "replacedName",
      birthday: "replacedBirthday",
      birthdayLocation: "replacedBirthdayLocation",
      orderDepartement: "replacedOrderDepartement",
      orderDepartmentNumber: "replacedOrderDepartmentNumber",
      address: "replacedProfessionnalAddress",
      email: "replacedEmail",
      gender: "replacedGender",
    },
    addressUserField: "officeAdress",
    addressLabel: "Adresse professionnelle",
    orderNumberInputType: "text",
  },
  substitute: {
    accordionId: 2,
    title: "Le remplaçant",
    fields: {
      name: "substituteName",
      birthday: "substituteBirthday",
      birthdayLocation: "substituteBirthdayLocation",
      orderDepartement: "substituteOrderDepartement",
      orderDepartmentNumber: "substituteOrderDepartmentNumber",
      address: "substituteAdress",
      email: "substituteEmail",
      gender: "substituteGender",
    },
    addressUserField: "personalAdress",
    addressLabel: "Adresse",
    orderNumberInputType: "number",
  },
};

function createKineFieldsState(role: KineRole) {
  const config = ROLE_CONFIG[role];

  // ------------ Input fields signals ------------
  const [professionnalAddress, setProfessionnalAddress] = createSignal<string>("");
  const [orderDepartmentNumber, setOrderDepartmentNumber] = createSignal<string>("");
  const [birthdayLocation, setBirthdayLocation] = createSignal<string>("");
  const [orderDepartement, setOrderDepartement] = createSignal<string>("");
  const [gender, setGender] = createSignal<GenderEnum>(GenderEnum.male);
  const [birthday, setBirthday] = createSignal<string>("");
  const [email, setEmail] = createSignal<string>("");
  const [name, setName] = createSignal<string>("");
  const [valid, setValid] = createSignal<boolean>(false);
  const [isFilledWithUser, setIsFilledWithUser] = createSignal<boolean>(false);

  function isValid() {
    if (name() && email() && birthday() && birthdayLocation() && orderDepartement() && orderDepartmentNumber() && professionnalAddress()) {
      setValid(true);
    } else {
      setValid(false);
    }
  }

  // Mettre à jour uniquement le signal du champ modifié au lieu de tous les champs
  // (évite de réinitialiser le champ en cours de modification avec une valeur obsolète)
  function updateFormAndPdfInputs(field: UiField, value: string) {
    switch (field) {
      case "name": setName(value); break;
      case "email": setEmail(value); break;
      case "birthday": setBirthday(value); break;
      case "birthdayLocation": setBirthdayLocation(value); break;
      case "orderDepartement": setOrderDepartement(value); break;
      case "orderDepartmentNumber": setOrderDepartmentNumber(value); break;
      case "address": setProfessionnalAddress(value); break;
      case "gender": setGender(value as GenderEnum); break;
    }

    currentPDFTool()?.updateContractDataAndPDFFields(config.fields[field], value, gender());
    isValid();
  }

  function fillWithMyInformations() {
    // Signale l'autre accordéon de se vider : triggerFill(role) pose le mode,
    // et l'accordéon opposé (useFillMode(role, …)) réagit en se vidant.
    triggerFill(role);

    const userDatas: UserEntity = storeService.data.user as UserEntity;
    const tool = currentPDFTool();
    if (!tool) return;

    if (role === "replaced") {
      // Comportement historique du remplacé : genre issu du profil utilisateur
      setGender(userDatas.gender ?? GenderEnum.male);
    } else {
      // DIVERGENCE PRÉSERVÉE (à trancher côté métier) : le remplaçant relit le
      // genre depuis le contrat en cours au lieu du profil utilisateur.
      const contractDataFromStore = tool.getContractData();
      const currentGender = contractDataFromStore.substituteGender ?? GenderEnum.male;
      setGender(currentGender);
      if (!contractDataFromStore.substituteGender) {
        tool.updateField("substituteGender", currentGender);
      }
    }

    // IMPORTANT : mettre à jour le nom en premier pour s'assurer qu'il est bien dans le store
    updateFormAndPdfInputs("name", userDatas.fullname);
    updateFormAndPdfInputs("email", userDatas.email);
    // Formater la date correctement pour l'input de type "date" (YYYY-MM-DD)
    const formattedBirthday = formatDateForInput(userDatas.birthday instanceof Date ? userDatas.birthday.toISOString() : userDatas.birthday);
    updateFormAndPdfInputs("birthday", formattedBirthday);
    updateFormAndPdfInputs("birthdayLocation", userDatas.bornLocation);
    updateFormAndPdfInputs("orderDepartement", userDatas.department);
    updateFormAndPdfInputs("orderDepartmentNumber", userDatas.orderNumber ? userDatas.orderNumber.toString() : "");
    updateFormAndPdfInputs("address", userDatas[config.addressUserField] ?? "");

    setIsFilledWithUser(true);
  }

  function removeMyInformations() {
    clearFields();
    setIsFilledWithUser(false);
  }

  function hydrateFromContractData() {
    const contractData = currentPDFTool()?.contractData;
    setGender((contractData?.[config.fields.gender] as GenderEnum) ?? GenderEnum.male);
    setEmail((contractData?.[config.fields.email] ?? "") as string);
    setName((contractData?.[config.fields.name] ?? "") as string);
    setBirthday(formatDateForInput(contractData?.[config.fields.birthday] as string));
    setBirthdayLocation((contractData?.[config.fields.birthdayLocation] ?? "") as string);
    setOrderDepartement((contractData?.[config.fields.orderDepartement] ?? "") as string);
    setOrderDepartmentNumber((contractData?.[config.fields.orderDepartmentNumber])?.toString() ?? "");
    setProfessionnalAddress((contractData?.[config.fields.address] ?? "") as string);
  }

  function resetToDefaults() {
    setGender(GenderEnum.male);
    setEmail("");
    setName("");
    setBirthday("");
    setBirthdayLocation("");
    setOrderDepartement("");
    setOrderDepartmentNumber("");
    setProfessionnalAddress("");
  }

  function clearFields() {
    // Remettre les valeurs par défaut (et vider les champs PDF correspondants)
    setGender(GenderEnum.male);
    updateFormAndPdfInputs("gender", GenderEnum.male);
    updateFormAndPdfInputs("name", "");
    updateFormAndPdfInputs("email", "");
    updateFormAndPdfInputs("birthday", "");
    updateFormAndPdfInputs("birthdayLocation", "");
    updateFormAndPdfInputs("orderDepartement", "");
    updateFormAndPdfInputs("orderDepartmentNumber", "");
    updateFormAndPdfInputs("address", "");
  }

  return {
    config,
    gender,
    name,
    email,
    birthday,
    birthdayLocation,
    orderDepartement,
    orderDepartmentNumber,
    professionnalAddress,
    valid,
    isFilledWithUser,
    setIsFilledWithUser,
    updateFormAndPdfInputs,
    fillWithMyInformations,
    removeMyInformations,
    clearFields,
    hydrateFromContractData,
    resetToDefaults,
    isValid,
  };
}

// État module-level par rôle — même cycle de vie que les deux fichiers d'origine
// (signaux créés au chargement du module, une instance d'écran par rôle).
const STATES: Record<KineRole, ReturnType<typeof createKineFieldsState>> = {
  replaced: createKineFieldsState("replaced"),
  substitute: createKineFieldsState("substitute"),
};

// API nommée rétro-compatible pour les appelants externes (ContractInformationsFields, ContratInformationsDropdowns)
export const fillWithMyInformationsReplaced = () => STATES.replaced.fillWithMyInformations();
export const removeMyInformationsReplaced = () => STATES.replaced.removeMyInformations();
export const isFilledWithUserReplaced = STATES.replaced.isFilledWithUser;
export const setIsFilledWithUserReplaced = STATES.replaced.setIsFilledWithUser;
export const fillWithMyInformationsSubstitute = () => STATES.substitute.fillWithMyInformations();
export const removeMyInformationsSubstitute = () => STATES.substitute.removeMyInformations();
export const isFilledWithUserSubstitute = STATES.substitute.isFilledWithUser;
export const setIsFilledWithUserSubstitute = STATES.substitute.setIsFilledWithUser;

export function KineFields(props: AccordionFieldsProps & { role: KineRole }) {
  const state = STATES[props.role];
  const config = state.config;

  onMount(() => {
    if (loadContract()) {
      state.hydrateFromContractData();
    } else {
      state.resetToDefaults();
    }
    state.isValid();
  });

  // Écoute le mode de remplissage : si l'autre accordéon est rempli, on vide celui-ci
  useFillMode(props.role === "replaced" ? "substitute" : "replaced", () => {
    STATES[props.role].clearFields();
    STATES[props.role].setIsFilledWithUser(false);
  });

  const isOpen = () =>
    (typeof props.items === "function" ? props.items() : props.items).find((i) => i.id === config.accordionId)?.isOpen ?? false;

  return (
    <DropdownItem
      id={config.accordionId}
      title={config.title}
      toggle={props.toggleItem}
      isOpen={isOpen()}
      valid={state.valid()}
    >
      <Show when={storeService.data.user?.email !== ""}>
        <div class="flex w-full justify-end">
          <FitFieldsWithUserData
            onFill={state.fillWithMyInformations}
            onClear={state.removeMyInformations}
            isFilled={state.isFilledWithUser()}
          />
        </div>
      </Show>

      <RadioButtons
        legend="Genre"
        name={`${props.role}-gender`}
        items={[
          { id: `${props.role}-mister`, text: "Monsieur", value: GenderEnum.male },
          { id: `${props.role}-miss`, text: "Madame", value: GenderEnum.female },
        ]}
        onChange={(e) => {
          const target = e.target as HTMLInputElement;
          state.updateFormAndPdfInputs("gender", target.value as GenderEnum);
        }}
        value={state.gender()}
      />

      <LabeledInput
        id={`${props.role}-name`}
        label="Nom, prénom"
        type="text"
        onInput={(e) => state.updateFormAndPdfInputs("name", e.target.value)}
        value={state.name()}
      />
      <LabeledInput
        id={`${props.role}-mail`}
        label="Email"
        type="email"
        onInput={(e) => state.updateFormAndPdfInputs("email", e.target.value)}
        value={state.email()}
      />
      <LabeledInput
        id={`${props.role}-birthday`}
        label="Né(e) le"
        type="date"
        onInput={(e) => state.updateFormAndPdfInputs("birthday", e.target.value)}
        value={state.birthday()}
      />
      <LabeledInput
        id={`${props.role}-birthday-location`}
        label="Né(e) à"
        type="text"
        onInput={(e) => state.updateFormAndPdfInputs("birthdayLocation", e.target.value)}
        value={state.birthdayLocation()}
      />
      <LabeledInput
        id={`${props.role}-department-order`}
        label="Département d'ordre"
        type="text"
        onInput={(e) => state.updateFormAndPdfInputs("orderDepartement", e.target.value)}
        value={state.orderDepartement()}
      />
      <LabeledInput
        id={`${props.role}-department-number-order`}
        label="Numéro d'ordre"
        type={config.orderNumberInputType}
        onInput={(e) => state.updateFormAndPdfInputs("orderDepartmentNumber", e.target.value)}
        value={state.orderDepartmentNumber()}
      />
      <LabeledInput
        id={`${props.role}-address`}
        label={config.addressLabel}
        type="text"
        onInput={(e) => state.updateFormAndPdfInputs("address", e.target.value)}
        value={state.professionnalAddress()}
      />
    </DropdownItem>
  );
}
