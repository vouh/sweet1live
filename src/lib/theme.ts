export const THEME_STORAGE_KEY = "sweet1ne-theme";

/** Inline before paint to avoid a flash of the wrong theme. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var theme=t==='light'?'light':'dark';var r=document.documentElement;r.classList.remove('dark','light');r.classList.add(theme);r.style.colorScheme=theme;}catch(e){}})();`;
