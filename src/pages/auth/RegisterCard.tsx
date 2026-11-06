import { createSignal, Setter } from "solid-js";
import { UserEntity } from "../../models/user.entity";
import { authService } from "../../services/auth.service";
import { LabeledInput } from "../../components/inputs/LabeledInput";
import { TitleForm } from "../../components/titles/TitleForm";
import { AuthWrapper } from "./AuthWrapper";
import { Button } from "../../components/buttons/Button";
import { RadioButtons } from "../../components/inputs/DialogToInputRadio";

export function RegisterCard() {
  const [gender, setGender] = createSignal<string>("male");

  // Référence à votre formulaire
  const [formRef, setFormRef] = createSignal<HTMLFormElement>();

  // Fonction pour récupérer les données du formulaire
  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault(); // Empêche le comportement par défaut du formulaire

    const formElements: HTMLFormControlsCollection &
      {
        name: string;
        value: string;
      }[] = formRef()!.elements as HTMLFormControlsCollection &
      {
        name: string;
        value: string;
      }[];

    const data: Record<string, string> = {};

    // Itérer sur les éléments du formulaire pour récupérer les valeurs
    for (let element of formElements) {
      if (element.name) {
        if (element.name != "gender") {
          data[element.name] = element.value;
        }
      }
    }
    data["gender"] = gender();

    await authService.register(data as Partial<UserEntity>);
  }

  return (
    <AuthWrapper setFormRef={setFormRef as Setter<HTMLFormElement>} handleSubmit={handleSubmit}>
      <TitleForm title="Je rejoin la platform" />

      <div class="flex flex-col p-6 h-[450px] overflow-y-auto">
        <LabeledInput
          label="Nom et Prénom"
          id="fullname"
          required
          type="text"

        />
        <LabeledInput
          label="Email"
          id="email"
          required
          type="text"
        />
        <LabeledInput
          label="Mot de passe"
          id="password"
          type="password"
          required
        />
        <LabeledInput
          label="Département d'ordre des kinésithérapeutes"
          id="department"
          type="text"
          required
        />
        <LabeledInput
          label="Numéro d'ordre"
          id="orderNumber"
          type="number"
          required
        />
        <LabeledInput
          label="Née le"
          id="birthday"
          type="date"
          required
        />
        <LabeledInput
          label="Née à"
          id="bornLocation"
          type="text"
          required
        />
        <LabeledInput
          label="Adresse personnelle"
          id="personalAdress"
          type="text"
          required
        />
        <LabeledInput
          label="Adresse professionnelle"
          id="officeAdress"
          type="text"
          required
        />
        <LabeledInput
          label="Numéro de téléphone"
          id="phoneNumber"
          type="text"
          required
        />
        <RadioButtons
          name="gender"
          onChange={(e: Event) => {

            setGender((e.target as HTMLInputElement).value);
          }}
          value={gender()}
          legend="Genre"
          items={[
            { text: "Homme", value: "male", id: "genderM" },
            { text: "Femme", value: "female", id: "genderF" },
          ]}

        />
      </div>

      <div class="flex justify-end p-5">
        <Button text="S'enregistrer" type="submit" onClick={() => { }} preventDefault={false} />
      </div>
    </AuthWrapper>
  );
}
