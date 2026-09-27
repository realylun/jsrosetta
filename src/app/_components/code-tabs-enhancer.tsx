"use client";

import { useEffect } from "react";
import {
  nextTabForKey,
  readStoredLang,
  selectEverywhere,
  storeLang,
} from "@/lib/code-tabs-dom";

function activate(tab: HTMLElement) {
  const lang = tab.dataset.lang;
  if (!lang) return;
  // Keep the clicked tab still on screen while groups above it change height.
  const before = tab.getBoundingClientRect().top;
  selectEverywhere(document, lang);
  window.scrollBy(0, tab.getBoundingClientRect().top - before);
  storeLang(lang);
}

/**
 * Progressive enhancement for server-rendered code tabs:
 * picking a language switches every tab group on the page and is remembered.
 * `?lang=rust` in the URL takes precedence over the stored choice.
 */
export function CodeTabsEnhancer() {
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("lang") ?? readStoredLang();
    if (initial) selectEverywhere(document, initial);

    const onClick = (event: MouseEvent) => {
      const tab = (event.target as Element | null)?.closest<HTMLElement>(
        '[data-code-tabs] [role="tab"]',
      );
      if (tab) activate(tab);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const current = (event.target as Element | null)?.closest<HTMLElement>(
        '[data-code-tabs] [role="tab"]',
      );
      if (!current) return;
      const next = nextTabForKey(current, event.key);
      if (!next) return;
      event.preventDefault();
      activate(next);
      next.focus();
    };

    // Find-in-page revealed a hidden panel (hidden="until-found"): make its tab the active one.
    const onBeforeMatch = (event: Event) => {
      const panel = (event.target as Element | null)?.closest<HTMLElement>('[role="tabpanel"]');
      const tab = panel && document.getElementById(panel.getAttribute("aria-labelledby") ?? "");
      if (tab) activate(tab);
    };

    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("beforematch", onBeforeMatch, true);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("beforematch", onBeforeMatch, true);
    };
  }, []);

  return null;
}
