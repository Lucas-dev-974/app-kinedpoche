import { createSignal } from "solid-js";
import { closeDialogTool, DIALOG_NAMES, DialogWrapper } from "../dialog/DialogWrapper";
import { LabeledInput } from "../inputs/LabeledInput";
import { AuthorsEnum, GenderEnum } from "../../utils/PDFTool";
import { RadioButtons } from "../inputs/DialogToInputRadio";
import { Button } from "../buttons/Button";
import { UserEntity } from "../../models/user.entity";
import storeService from "../../utils/store.service";
import { NotificationService } from "../../utils/notification.service";
import { formatDateForInput } from "../ContractDialog/DropdownContratInformations/ContratInformationsDropdowns";

export function RegisterInformationsInLocal(props: { isInNavbar?: boolean }) {
    let birthdayDate: Date | undefined = undefined;
    if (storeService.proxy.user) {
        if (storeService.proxy.user.birthday) {
            birthdayDate = new Date(storeService.proxy.user.birthday);
        }
    }

    let formattedBirthday = "";
    if (birthdayDate) {
        formattedBirthday = formatDateForInput(birthdayDate.toISOString());
    } else {
        formattedBirthday = "";
    }

    const title = props.isInNavbar ? "Modifier vos Informations" : "Enregistrer vos Informations";

    const [name, setName] = createSignal<string>(storeService.proxy.user?.fullname ?? "");
    const [email, setEmail] = createSignal<string>(storeService.proxy.user?.email ?? "");
    const [orderNumber, setOrderNumber] = createSignal<number>(storeService.proxy.user?.orderNumber ?? 0);
    const [department, setDepartment] = createSignal<string>(storeService.proxy.user?.department ?? "");
    const [birthday, setBirthday] = createSignal<string>(formattedBirthday);
    const [bornLocation, setBornLocation] = createSignal<string>(storeService.proxy.user?.bornLocation ?? "");
    const [personalAdress, setPersonalAdress] = createSignal<string>(storeService.proxy.user?.personalAdress ?? "");
    const [officeAdress, setOfficeAdress] = createSignal<string>(storeService.proxy.user?.officeAdress ?? "");
    const [gender, setGender] = createSignal<GenderEnum>(storeService.proxy.user?.gender ?? GenderEnum.male);

    // Même regex que SendContractTo (audit 🟡)
    const validateEmail = (email: string): boolean =>
        /^([^\s@])+@([^\s@])+\.([^\s@])+$/.test(email);

    function saveInformations() {
        // Audit 🟡 : valider AVANT d'écrire — un email invalide ou un birthday
        // vide sérialisait 'Invalid Date' (null en localStorage) qui se
        // retrouvait ensuite dans le flux PDF.
        if (!validateEmail(email())) {
            NotificationService.push({
                content: "Format d'email invalide",
                type: "error",
            });
            return;
        }

        const birthdayDate = birthday() ? new Date(birthday()) : undefined;
        if (birthdayDate && isNaN(birthdayDate.getTime())) {
            NotificationService.push({
                content: "Date de naissance invalide",
                type: "error",
            });
            return;
        }

        const informations: UserEntity = {
            fullname: name(),
            email: email(),
            orderNumber: orderNumber(),
            department: department(),
            birthday: birthdayDate,
            bornLocation: bornLocation(),
            personalAdress: personalAdress(),
            officeAdress: officeAdress(),
            gender: gender(),
            status: AuthorsEnum.professional,
        };
        storeService.proxy.user = informations;

        NotificationService.push({
            content: "Informations enregistrées.",
            type: "info",
        });
        closeDialogTool(DIALOG_NAMES.registerInformations);
    }

    return (
        <DialogWrapper
            name="registerInformations"
            btnText={title}
            title={title}
            isInNavbar={props.isInNavbar}
        >
            <div class="p-3 max-h-[70vh]">
                <LabeledInput
                    id="name"
                    label="Nom, prénom"
                    type="text"
                    value={name()}
                    onInput={(e) => setName(e.target.value)}
                />
                <LabeledInput
                    id="email"
                    label="Email"
                    type="text"
                    value={email()}
                    onInput={(e) => setEmail(e.target.value)}
                />
                <LabeledInput
                    id="orderNumber"
                    label="Numéro d'ordre"
                    type="number"
                    value={orderNumber().toString()}
                    onInput={(e) => setOrderNumber(Number(e.target.value))}
                />
                <LabeledInput
                    id="department"
                    label="Département"
                    type="text"
                    value={department()}
                    onInput={(e) => setDepartment(e.target.value)}
                />
                <LabeledInput
                    id="birthday"
                    label="Date de naissance"
                    type="date"
                    value={birthday()}
                    onInput={(e) => setBirthday(e.target.value)}
                />
                <LabeledInput
                    id="bornLocation"
                    label="Lieu de naissance"
                    type="text"
                    value={bornLocation()}
                    onInput={(e) => setBornLocation(e.target.value)}
                />

                <LabeledInput
                    id="personalAdress"
                    label="Adresse personnelle"
                    type="text"
                    value={personalAdress()}
                    onInput={(e) => setPersonalAdress(e.target.value)}
                />
                <LabeledInput
                    id="officeAdress"
                    label="Adresse professionnelle"
                    type="text"
                    value={officeAdress()}
                    onInput={(e) => setOfficeAdress(e.target.value)}
                />
                <RadioButtons
                    name="gender"
                    value={gender()}
                    onChange={(e: Event) => setGender((e.target as HTMLInputElement).value as GenderEnum)}
                    legend="Genre"
                    items={[
                        { text: "Homme", value: "male", id: "genderM" },
                        { text: "Femme", value: "female", id: "genderF" },
                    ]}
                />


                <div class="flex justify-end">
                    <Button text="Enregistrer" onClick={saveInformations} />
                </div>
            </div>
        </DialogWrapper>
    )
}