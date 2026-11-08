const STORAGE_KEY = "gh_cookie_consent_v1";
const CONSENT_LIFETIME_MS = 180 * 24 * 60 * 60 * 1000;
const root = document.querySelector("[data-cookie-consent]");
const settings = root?.querySelector("[data-cookie-settings]");
const settingsButton = root?.querySelector('[data-cookie-action="settings"]');
const analyticsCheckbox = root?.querySelector("[data-cookie-analytics]");
const marketingCheckbox = root?.querySelector("[data-cookie-marketing]");
const footerButton = document.querySelector("[data-open-cookie-settings]");

if (root && settings && settingsButton && analyticsCheckbox && marketingCheckbox) {
  let config = { ga4Id: "", metaPixelId: "", gtmContainerId: "" };
  let currentConsent = null;
  let returnFocusTo = null;
  let googleInitialized = false;
  let googleLoaded = false;
  let metaLoaded = false;

  const signature = () => JSON.stringify([2, config.ga4Id, config.metaPixelId, config.gtmContainerId]);

  const readConsent = () => {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (value?.signature !== signature() || typeof value.analytics !== "boolean" || typeof value.marketing !== "boolean" || typeof value.expiresAt !== "number" || value.expiresAt <= Date.now()) return null;
      return { analytics: value.analytics, marketing: value.marketing };
    } catch {
      return null;
    }
  };

  const clearCookies = (category) => {
    const names = document.cookie.split(";").map((entry) => entry.trim().split("=")[0]);
    const shouldClear = category === "analytics"
      ? (name) => name === "_gid" || name === "_gat" || name.startsWith("_ga")
      : (name) => name === "_fbp" || name === "_fbc";
    const host = location.hostname;
    const domains = ["", host, ...(host === "groomerhouse.pl" || host.endsWith(".groomerhouse.pl") ? [".groomerhouse.pl"] : [])];
    for (const name of names.filter(shouldClear)) {
      for (const domain of domains) {
        document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? `; Domain=${domain}` : ""}`;
      }
    }
  };

  const googleConsent = (choice) => ({
    analytics_storage: choice.analytics ? "granted" : "denied",
    ad_storage: choice.marketing ? "granted" : "denied",
    ad_user_data: choice.marketing ? "granted" : "denied",
    ad_personalization: choice.marketing ? "granted" : "denied",
    functionality_storage: "granted",
    security_storage: "granted",
  });

  const initGoogleConsent = () => {
    if ((!config.ga4Id && !config.gtmContainerId) || googleInitialized) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("consent", "default", googleConsent({ analytics: false, marketing: false }));
    googleInitialized = true;
  };

  const syncTracking = (choice) => {
    if (config.ga4Id || config.gtmContainerId) {
      initGoogleConsent();
      window.gtag("consent", "update", googleConsent(choice));
    }

    if (config.gtmContainerId && choice.analytics && !googleLoaded) {
      window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(config.gtmContainerId)}`;
      document.head.append(script);
      googleLoaded = true;
    }

    if (config.ga4Id) {
      if (choice.analytics && !googleLoaded) {
        window.gtag("js", new Date());
        window.gtag("config", config.ga4Id);
        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.ga4Id)}`;
        document.head.append(script);
        googleLoaded = true;
      }
    }

    if (config.metaPixelId && choice.marketing && !metaLoaded) {
      if (!window.fbq) {
        const fbq = function () {
          if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
          else fbq.queue.push(arguments);
        };
        fbq.queue = [];
        fbq.loaded = true;
        fbq.version = "2.0";
        window.fbq = fbq;
      }
      window.fbq("init", config.metaPixelId);
      window.fbq("track", "PageView");
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.append(script);
      metaLoaded = true;
    }
  };

  const setSettingsOpen = (open) => {
    settings.hidden = !open;
    settingsButton.setAttribute("aria-expanded", String(open));
    if (open) analyticsCheckbox.focus();
  };

  const showBanner = (openSettings = false) => {
    analyticsCheckbox.checked = currentConsent?.analytics || false;
    marketingCheckbox.checked = currentConsent?.marketing || false;
    root.hidden = false;
    setSettingsOpen(openSettings);
  };

  const saveConsent = (choice) => {
    const revoked = currentConsent && ((currentConsent.analytics && !choice.analytics) || (currentConsent.marketing && !choice.marketing));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ signature: signature(), expiresAt: Date.now() + CONSENT_LIFETIME_MS, ...choice }));
    } catch { /* Without storage, the banner returns on the next visit. */ }
    currentConsent = choice;
    if (!choice.analytics) clearCookies("analytics");
    if (!choice.marketing) clearCookies("marketing");
    root.hidden = true;
    returnFocusTo?.focus();
    returnFocusTo = null;
    // Already-loaded vendor scripts cannot safely be unloaded from this page.
    if (revoked) {
      location.reload();
      return;
    }
    syncTracking(choice);
  };

  root.addEventListener("click", (event) => {
    const action = event.target.closest("[data-cookie-action]")?.dataset.cookieAction;
    if (action === "accept") saveConsent({ analytics: true, marketing: true });
    if (action === "reject") saveConsent({ analytics: false, marketing: false });
    if (action === "save") saveConsent({ analytics: analyticsCheckbox.checked, marketing: marketingCheckbox.checked });
    if (action === "settings") setSettingsOpen(settings.hidden);
  });

  footerButton?.addEventListener("click", () => {
    returnFocusTo = footerButton;
    showBanner(true);
  });

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) location.reload();
  });

  const start = async () => {
    try {
      const response = await fetch("/api/tracking-config", { cache: "no-store", credentials: "same-origin" });
      if (response.ok) {
        const candidate = await response.json();
        config = {
          ga4Id: /^G-[A-Z0-9]+$/.test(candidate.ga4Id) ? candidate.ga4Id : "",
          metaPixelId: /^\d{8,25}$/.test(candidate.metaPixelId) ? candidate.metaPixelId : "",
          gtmContainerId: /^GTM-[A-Z0-9]+$/.test(candidate.gtmContainerId) ? candidate.gtmContainerId : "",
        };
      }
    } catch { /* Fail closed: no external tracking scripts are loaded. */ }

    currentConsent = readConsent();
    if (currentConsent) {
      if (!currentConsent.analytics) clearCookies("analytics");
      if (!currentConsent.marketing) clearCookies("marketing");
      syncTracking(currentConsent);
    } else {
      clearCookies("analytics");
      clearCookies("marketing");
      showBanner();
    }
  };

  start();
}
