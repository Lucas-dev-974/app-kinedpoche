import { createSignal, Match, Switch } from "solid-js";
import { BottomMenuPageContract } from "./bottom-menu-pages/BottomMenuPageContract";
import { BottomMenuHeader } from "./BottomMenuHeader";
import { BottomMenuPageBtnGroups } from "./BottomMenuPageBtnGroups";

export enum DocsViewsEnum {
  contract = "contract",
  clientFiles = "fiches clients",
}

export interface DocsViewsItems {
  title: string;
  action: () => void;
}

export function BottomMenuPageRouter() {
  const [currentDocsView, setCurrentDocsView] = createSignal<DocsViewsEnum>(DocsViewsEnum.contract);
  const changeCurrentDocsView = (view: DocsViewsEnum) => setCurrentDocsView(view);


  return (
    <div class="flex min-h-0 flex-1 flex-col">
      <BottomMenuHeader />

      {/* Corps scrollable (la feuille capte une hauteur fixe : 85vh / 600px) */}
      <div class="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-4">
        <BottomMenuPageBtnGroups changeCurrentDocsView={changeCurrentDocsView} currentDocsView={currentDocsView()} />
        <Switch>
          <Match when={currentDocsView() == DocsViewsEnum.contract}>
            <BottomMenuPageContract />
          </Match>
          <Match when={currentDocsView() == DocsViewsEnum.clientFiles}>
            <div>Fiche clients</div>
          </Match>
        </Switch>
      </div>
    </div>
  );
}
