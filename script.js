// Preserve previously shared hash links while moving to full HTML pages.
const legacyRoutes = {
  home: "/", product: "/software-implementation/", solutions: "/software-implementation/",
  why: "/us-staffing/", pricing: "/contact/?service=implementation",
  resources: "/resources/", about: "/about/", contact: "/contact/"
};
const redirectLegacyHash = () => {
  if (!["/", "/index.html"].includes(window.location.pathname)) return;
  const key = window.location.hash.slice(1);
  const destination = Object.hasOwn(legacyRoutes, key) ? legacyRoutes[key] : null;
  if (destination === "/") window.history.replaceState(null, "", "/");
  else if (destination) window.location.replace(destination);
};
redirectLegacyHash();
window.addEventListener("hashchange", redirectLegacyHash);
const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
document.body.classList.add("js-enabled");
if (navToggle) navToggle.hidden = false;
const closeNavigation = () => {
  nav?.classList.remove("is-open");
  document.body.classList.remove("nav-open");
  navToggle?.setAttribute("aria-expanded", "false");
  navToggle?.setAttribute("aria-label", "Open navigation");
};
navToggle?.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  document.body.classList.toggle("nav-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && nav?.classList.contains("is-open")) {
    closeNavigation(); navToggle?.focus();
  }
});
// The navigation is a disclosure, not a modal: let Tab leave it normally.
header?.addEventListener("focusout", (event) => {
  if (event.relatedTarget && !header.contains(event.relatedTarget)) closeNavigation();
});
document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  if (!header?.contains(event.target) || event.target.closest("[data-nav] a")) closeNavigation();
  if (event.target.closest('a[href="#main-content"]')) {
    event.preventDefault(); document.querySelector("#main-content")?.focus();
  }
});
window.matchMedia("(min-width: 1120px)").addEventListener("change", closeNavigation);
window.addEventListener("scroll", () => header?.classList.toggle("is-scrolled", window.scrollY > 10), { passive: true });

const form = document.querySelector("[data-enquiry-form]");
if (form) {
  const status = form.querySelector("[data-send-status]");
  const button = form.querySelector('[type="submit"]');
  const interest = form.elements.interest;
  const services = {
    hiring: "Include the role title, number of openings, essential skills, work arrangement, and interview process.",
    implementation: "Include the software name if selected, your current process, user groups, and the result you want to achieve.",
    "staffing-software": "Describe your recruiting workflow, the platform you use or are considering, and what needs to change."
  };
  const updateHelp = () => {
    form.querySelector("[data-requirements-help]").textContent = services[interest.value] || "Describe the role you need to fill or the software project you want to implement.";
  };
  const preset = new URLSearchParams(window.location.search).get("service");
  if (Object.hasOwn(services, preset)) interest.value = preset;
  updateHelp(); form.hidden = false;
  let token = "", tokenReadyAt = 0, loading = false, submitting = false;
  const prepare = async () => {
    loading = true; button.disabled = true; button.textContent = "Loading form...";
    try {
      const response = await fetch("/api/contact/", { cache: "no-store", signal: AbortSignal.timeout(12000) });
      const data = await response.json();
      if (!response.ok || !data.token) throw new Error();
      token = data.token; tokenReadyAt = Date.now() + 3200;
      button.textContent = "Send enquiry";
    } catch {
      token = ""; button.textContent = "Retry connection";
      status.textContent = "Online sending is unavailable. Your text stays here. Try again or email info@hrm-solutions.com.";
      status.dataset.state = "error";
    } finally { loading = false; button.disabled = false; }
  };
  form.addEventListener("input", event => { event.target.setCustomValidity?.(""); updateHelp(); });
  form.addEventListener("change", updateHelp);
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (submitting || loading) return;
    for (const field of form.querySelectorAll("[required]")) field.setCustomValidity(field.value.trim() ? "" : "Please complete this field.");
    if (!form.reportValidity()) return;
    if (!token) { await prepare(); return; }
    if (Date.now() < tokenReadyAt) { status.textContent = "Please wait a few seconds, then send your enquiry."; return; }
    const values = Object.fromEntries(new FormData(form));
    submitting = true; button.disabled = true; button.textContent = "Sending...";
    form.setAttribute("aria-busy", "true"); status.textContent = "Sending your enquiry..."; status.dataset.state = "";
    // Keep submitted fields stable during the request, and preserve them on failure.
    const fields = [...form.querySelectorAll("input, select, textarea")]; fields.forEach(field => field.disabled = true);
    let succeeded = false;
    try {
      const response = await fetch("/api/contact/", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, token }), signal: AbortSignal.timeout(55000)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Sending could not be confirmed. Please email info@hrm-solutions.com.");
      succeeded = true; status.textContent = data.message; status.dataset.state = "success";
      form.reset(); if (Object.hasOwn(services, preset)) interest.value = preset; updateHelp();
      button.textContent = "Enquiry submitted";
    } catch (error) {
      status.textContent = error.name === "TimeoutError" || error instanceof TypeError
        ? "We could not confirm sending. Your text stays here. Please email info@hrm-solutions.com if you need help."
        : error.message;
      status.dataset.state = "error"; token = "";
      button.textContent = "Retry connection";
    } finally {
      submitting = false; form.removeAttribute("aria-busy"); fields.forEach(field => field.disabled = false);
      button.disabled = succeeded; status.focus();
    }
  });
  prepare();
}
