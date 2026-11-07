import { createSignal, Setter } from "solid-js";
import { UserEntity } from "../../models/user.entity";
import { authService } from "../../services/auth.service";
import { LabeledInput } from "../../components/inputs/LabeledInput";
import { TitleForm } from "../../components/titles/TitleForm";
import { AuthWrapper } from "./AuthWrapper";
import { Button } from "../../components/buttons/Button";

export function LoginCard() {
  // Référence à votre formulaire
  const [formRef, setFormRef] = createSignal<HTMLFormElement>();

  // Fonction pour récupérer les données du formulaire
  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault(); // Empêche le comportement par défaut du formulaire
    // Récupérer toutes les entrées du formulaire
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
        // Vérifie si l'élément a un attribut name
        data[element.name] = element.value;
      }
    }

    await authService.login(
      data as Pick<UserEntity, "email" | "password">
    );
  };

  return (
    <AuthWrapper setFormRef={setFormRef as Setter<HTMLFormElement>} handleSubmit={handleSubmit}>
      <TitleForm title="Se connecter" />

      <div class="flex flex-col gap-2 p-6">
        <LabeledInput label="email" type="email" onInput={() => { }} id="email" required />
        <LabeledInput label="mot de passe" type="password" onInput={() => { }} id="password" required />
        <p class="text-sm text-gray-500 cursor-pointer -translate-y-5">mot de passe oublié ? </p>
        <div class="flex justify-end">
          <Button text="Se connecter" type="submit" onClick={() => { }} preventDefault={false} />
        </div>
      </div>

    </AuthWrapper >
  );
}
