import { useNavigate } from "@solidjs/router";

export function NavbarTitle() {
    const navigate = useNavigate();

    return (
        <div class="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
            <div class="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] border-[1.5px] border-white/50 bg-white/15 font-[Nunito] text-[17px] font-bold text-white">K</div>
            <p class="m-0 font-[Nunito] text-base sm:text-lg font-bold text-white">Kinéd'poche</p>
        </div>
    )
}