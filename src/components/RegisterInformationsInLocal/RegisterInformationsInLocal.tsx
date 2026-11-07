import { createSignal } from "solid-js";
import { closeDialogTool, DIALOG_NAMES, DialogWrapper } from "../dialog/DialogWrapper";
import { LabeledInput } from "../inputs/LabeledInput";
import { AuthorsEnum, GenderEnum } from "../../utils/PDFTool";
import { Button } from "../buttons/Button";
import { UserEntity } from "../../models/user.entity";
import storeService from "../../utils/store.service";
import { NotificationService } from "../../utils/notification.service";
import { formatDateForInput } from "../ContractDialog/DropdownContratInformations/ContratInformationsDropdowns";

// Look pro du dialog : tokens statiques niveau module (aucune dépendance
// réactive) — sections repérées par une pastille verte + titre uppercase
// discret, libellés/entrées cohérents sur Nunito.
const labelCls = "font-[Nunito] text-[12.5px] font-bold text-slate-600 mb-1";
const inputCls = "w-full box-border rounded-[10px] border-slate-300 bg-white px-3 py-2 text-[14px] text-slate-800 shadow-sm duration-150 hover:border-slate-400 focus:border-[#099773] focus:outline-none focus:ring-2 focus:ring-[#099773]/25";
const wrapperCls = "grid grid-cols-1 py-0";
const sectionTitleCls = "m-0 mb-3 flex items-center gap-2 font-[Nunito] text-[11px] font-bold uppercase tracking-[0.09em] text-slate-400";
const genderItems = [
    { text: "Homme", value: "male", id: "genderM" },
    { text: "Femme", value: "female", id: "genderF" },
];

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

    const btnLabel = props.isInNavbar ? "Mes infos" : "Enregistrer vos informations";
    const title = props.isInNavbar ? "Modifier vos informations" : "Enregistrer vos informations";

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

        const parsedBirthday = birthday() ? new Date(birthday()) : undefined;
        if (parsedBirthday && isNaN(parsedBirthday.getTime())) {
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
            birthday: parsedBirthday,
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
            btnText={btnLabel}
            title={title}
            isInNavbar={props.isInNavbar}
            subtitle="Ces données alimentent vos contrats et votre profil."
            containerClassName={
                "fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-[200] "
                + "flex w-[92vw] max-w-[520px] max-h-[86vh] flex-col overflow-hidden rounded-2xl "
                + "bg-white ring-1 ring-black/[0.06] shadow-2xl"
            }
            bodyClassName="min-h-0 w-full box-border flex-1 overflow-y-auto bg-white px-5 pb-5 pt-5"
            footer={
                <div class="flex flex-none items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50 px-5 py-3.5">
                    <button
                        onClick={() => closeDialogTool(DIALOG_NAMES.registerInformations)}
                        class="m-0 cursor-pointer rounded-[10px] border border-slate-300 bg-white px-4 py-2 font-[Nunito] text-[13.5px] font-bold text-slate-600 duration-150 hover:border-slate-400 hover:text-slate-700"
                    >
                        Annuler
                    </button>
                    <Button text="Enregistrer" onClick={saveInformations} />
                </div>
            }
        >
            <div>
                {/* Section Identité */}
                <p class={sectionTitleCls}>
                    <span class="h-[6px] w-[6px] flex-none rounded-full bg-[#099773]" />
                    Identité
                </p>
                <div class="space-y-3.5">
                    <LabeledInput
                        id="name"
                        label="Nom, prénom"
                        type="text"
                        placeholder="Ex : Claire Fontan"
                        value={name()}
                        onInput={(e) => setName(e.target.value)}
                        labelClass={labelCls}
                        inputClass={inputCls}
                        wrapperClass={wrapperCls}
                    />
                    <div>
                        <p class={labelCls}>Genre</p>
                        {/* Pills segmentées : radios natifs masqués (a11y conservée). */}
                        <fieldset class="m-0 flex flex-wrap gap-2 border-none p-0">
                            {genderItems.map((item) => (
                                <label
                                    for={item.id}
                                    classList={{
                                        "m-0 flex cursor-pointer select-none items-center rounded-full border px-4 py-1.5 font-[Nunito] text-[12.5px] font-bold duration-150": true,
                                        "border-transparent bg-[#099773] text-white shadow-sm": gender() === item.value,
                                        "border-slate-300 bg-white text-slate-600 hover:border-[#099773]/70 hover:text-[#099773]": gender() !== item.value,
                                    }}
                                >
                                    <input
                                        type="radio"
                                        id={item.id}
                                        name="gender"
                                        class="sr-only"
                                        value={item.value}
                                        checked={gender() === item.value}
                                        onChange={(e: Event) => setGender((e.target as HTMLInputElement).value as GenderEnum)}
                                    />
                                    {item.text}
                                </label>
                            ))}
                        </fieldset>
                    </div>
                    <div class="grid gap-x-4 gap-y-3.5 sm:grid-cols-2">
                        <LabeledInput
                            id="birthday"
                            label="Date de naissance"
                            type="date"
                            value={birthday()}
                            onInput={(e) => setBirthday(e.target.value)}
                            labelClass={labelCls}
                            inputClass={inputCls}
                            wrapperClass={wrapperCls}
                        />
                        <LabeledInput
                            id="bornLocation"
                            label="Lieu de naissance"
                            type="text"
                            placeholder="Ex : Paris"
                            value={bornLocation()}
                            onInput={(e) => setBornLocation(e.target.value)}
                            labelClass={labelCls}
                            inputClass={inputCls}
                            wrapperClass={wrapperCls}
                        />
                    </div>
                </div>

                <div class="my-6 h-px w-full bg-slate-100" />

                {/* Section Coordonnées professionnelles */}
                <p class={sectionTitleCls}>
                    <span class="h-[6px] w-[6px] flex-none rounded-full bg-[#099773]" />
                    Coordonnées professionnelles
                </p>
                <div class="space-y-3.5">
                    <div class="grid gap-x-4 gap-y-3.5 sm:grid-cols-2">
                        <LabeledInput
                            id="orderNumber"
                            label="Numéro d'ordre"
                            type="number"
                            value={orderNumber().toString()}
                            onInput={(e) => setOrderNumber(Number(e.target.value))}
                            labelClass={labelCls}
                            inputClass={inputCls}
                            wrapperClass={wrapperCls}
                        />
                        <LabeledInput
                            id="department"
                            label="Département"
                            type="text"
                            placeholder="Ex : 75"
                            value={department()}
                            onInput={(e) => setDepartment(e.target.value)}
                            labelClass={labelCls}
                            inputClass={inputCls}
                            wrapperClass={wrapperCls}
                        />
                    </div>
                    <LabeledInput
                        id="email"
                        label="Email"
                        type="text"
                        placeholder="prenom.nom@email.com"
                        value={email()}
                        onInput={(e) => setEmail(e.target.value)}
                        labelClass={labelCls}
                        inputClass={inputCls}
                        wrapperClass={wrapperCls}
                    />
                </div>

                <div class="my-6 h-px w-full bg-slate-100" />

                {/* Section Adresses */}
                <p class={sectionTitleCls}>
                    <span class="h-[6px] w-[6px] flex-none rounded-full bg-[#099773]" />
                    Adresses
                </p>
                <div class="space-y-3.5">
                    <LabeledInput
                        id="personalAdress"
                        label="Adresse personnelle"
                        type="text"
                        placeholder="Ex : 12 rue de la Paix, 75002 Paris"
                        value={personalAdress()}
                        onInput={(e) => setPersonalAdress(e.target.value)}
                        labelClass={labelCls}
                        inputClass={inputCls}
                        wrapperClass={wrapperCls}
                    />
                    <LabeledInput
                        id="officeAdress"
                        label="Adresse professionnelle"
                        type="text"
                        placeholder="Cabinet, clinique…"
                        value={officeAdress()}
                        onInput={(e) => setOfficeAdress(e.target.value)}
                        labelClass={labelCls}
                        inputClass={inputCls}
                        wrapperClass={wrapperCls}
                    />
                </div>
            </div>
        </DialogWrapper>
    )
}
