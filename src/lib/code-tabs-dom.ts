/** DOM helpers for the `[data-code-tabs]` groups emitted by rehype-code-tabs. */

export const LANG_STORAGE_KEY = "jsrosetta-lang";

/** `until-found` keeps hidden panels searchable with Find-in-page and readable by reader modes. */
export const HIDDEN_PANEL = "until-found";

const tabsOf = (group: Element) =>
  Array.from(group.querySelectorAll<HTMLElement>('[role="tab"]'));

/** Select `lang` inside one group. Returns false (and changes nothing) if the group lacks it. */
export function selectInGroup(group: Element, lang: string): boolean {
  const tabs = tabsOf(group);
  if (!tabs.some((tab) => tab.dataset.lang === lang)) return false;

  for (const tab of tabs) {
    const selected = tab.dataset.lang === lang;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    const panelId = tab.getAttribute("aria-controls");
    const panel = panelId ? group.querySelector<HTMLElement>(`#${CSS.escape(panelId)}`) : null;
    if (!panel) continue;
    if (selected) panel.removeAttribute("hidden");
    else panel.setAttribute("hidden", HIDDEN_PANEL);
  }
  return true;
}

export function selectEverywhere(root: ParentNode, lang: string): void {
  for (const group of root.querySelectorAll("[data-code-tabs]")) {
    selectInGroup(group, lang);
  }
}

const KEY_OFFSETS: Readonly<Record<string, number>> = { ArrowRight: 1, ArrowLeft: -1 };

/** Roving-tabindex keyboard support (WAI-ARIA tabs pattern). Returns the tab to activate. */
export function nextTabForKey(current: HTMLElement, key: string): HTMLElement | undefined {
  const group = current.closest("[data-code-tabs]");
  if (!group) return undefined;
  const tabs = tabsOf(group);
  const index = tabs.indexOf(current);
  if (key === "Home") return tabs[0];
  if (key === "End") return tabs.at(-1);
  const offset = KEY_OFFSETS[key];
  if (offset === undefined) return undefined;
  return tabs[(index + offset + tabs.length) % tabs.length];
}

/**
 * Inline script placed right after server-rendered tab groups: applies the saved/URL language
 * before first paint so the page doesn't flash Node.js and then jump. Must stay self-contained.
 */
export const EARLY_SELECT_SCRIPT = `(function(){try{
var lang=new URLSearchParams(location.search).get("lang")||localStorage.getItem("${LANG_STORAGE_KEY}");
if(!lang)return;
document.querySelectorAll("[data-code-tabs]").forEach(function(g){
var tabs=g.querySelectorAll('[role="tab"]');
if(!g.querySelector('[role="tab"][data-lang="'+CSS.escape(lang)+'"]'))return;
tabs.forEach(function(t){var on=t.getAttribute("data-lang")===lang;
t.setAttribute("aria-selected",String(on));t.tabIndex=on?0:-1;
var p=document.getElementById(t.getAttribute("aria-controls"));
if(p){if(on)p.removeAttribute("hidden");else p.setAttribute("hidden","${HIDDEN_PANEL}");}});
});}catch(e){}})();`;

export function readStoredLang(): string | null {
  try {
    return localStorage.getItem(LANG_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeLang(lang: string): void {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // Storage can be unavailable (private mode, blocked cookies); selection still works for this page.
  }
}
