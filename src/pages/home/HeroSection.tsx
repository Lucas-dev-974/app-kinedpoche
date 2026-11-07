import { EditContractDialog } from "../../components/ContractDialog/EditContractDialog";
import { Title1 } from "../../components/titles/Title1";
import { Text } from "../../components/titles/Text";
import { Show } from "solid-js";
import { HiOutlineInformationCircle } from 'solid-icons/hi';
import { loggedIn } from "../../const.data";
import { RegisterInformationsInLocal } from "../../components/RegisterInformationsInLocal/RegisterInformationsInLocal";
import storeService from "../../utils/store.service";

export function HeroSection() {
    return (
        <div class="flex flex-col  items-center flex-wrap">
            <Title1
                prevTextIcon={<HiOutlineInformationCircle size={window.innerWidth > 768 ? 48 : 32} color="#099773" />}
                text="Simplifie la gestion de tes contrats avec tes confrères" />

            <Text text="Kiné de poche est un outil dédié aux kinésithérapeutes, conçu pour simplifier la création de contrats. Gagnez du temps en générant automatiquement des documents conformes et personnalisés en quelques clics." />

            <span class="my-2" />
            <Show when={!loggedIn()}>
                <div class="flex flex-wrap gap-3 w-full justify-center md:justify-start">
                    <Show when={!storeService.data.user || storeService.data.user.email === ""}>
                        <RegisterInformationsInLocal />
                    </Show>
                </div>
            </Show>

            <div class="w-full my-3">
                <EditContractDialog />
            </div>
        </div>)
}