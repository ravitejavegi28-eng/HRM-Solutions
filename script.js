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
  const result = form.querySelector("[data-enquiry-result]");
  const status = form.querySelector("[data-enquiry-status]");
  const draft = form.querySelector("#enquiry-draft");
  const emailLink = form.querySelector("[data-email-draft]");
  const copyStatus = form.querySelector("[data-copy-status]");
  const interest = form.elements.interest;
  const services = {
    hiring: { label: "US staffing / hiring requirement", help: "Include the role title, number of openings, essential skills, work arrangement, and interview process." },
    implementation: { label: "Software implementation", help: "Include the software name if selected, your current process, user groups, and the result you want to achieve." },
    "staffing-software": { label: "Software implementation for a staffing business", help: "Describe your recruiting workflow, the platform you use or are considering, and what needs to change." }
  };
  const updateHelp = () => {
    form.querySelector("[data-requirements-help]").textContent = services[interest.value]?.help || "Describe the role you need to fill or the software project you want to implement.";
  };
  const preset = new URLSearchParams(window.location.search).get("service");
  if (Object.hasOwn(services, preset)) interest.value = preset;
  updateHelp(); form.hidden = false;
  const clearDraft = () => {
    result.hidden = true; draft.value = "";
    emailLink.href = "mailto:info@hrm-solutions.com";
    status.textContent = ""; copyStatus.textContent = "";
  };
  form.addEventListener("input", (event) => {
    event.target.setCustomValidity?.(""); clearDraft(); updateHelp();
  });
  form.addEventListener("change", () => { clearDraft(); updateHelp(); });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    for (const field of form.querySelectorAll("[required]")) {
      field.setCustomValidity(field.value.trim() ? "" : "Please complete this field.");
    }
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const value = (key) => String(data.get(key) || "").trim();
    const service = services[value("interest")]?.label;
    if (!service) return;
    const subject = `${service}${value("company") ? ` — ${value("company")}` : ""}`;
    const body = ["Hello HRM-Solutions,", "", `Request: ${service}`, "", value("message"), "",
      `Name: ${value("name")}`, `Email: ${value("email")}`,
      ...[["company", "Company"], ["role", "Role"], ["location", "Work or project location"], ["timing", "Timeline"]]
        .filter(([key]) => value(key)).map(([key, label]) => `${label}: ${value(key)}`)
    ].join("\n");
    draft.value = `To: info@hrm-solutions.com\nSubject: ${subject}\n\n${body}`;
    emailLink.href = `mailto:info@hrm-solutions.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    result.hidden = false;
    status.textContent = "Your draft is ready. Review it below, then open your email app to send it.";
    copyStatus.textContent = "";
  });
  form.querySelector("[data-copy-enquiry]").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(draft.value);
      copyStatus.textContent = "Email text copied. Paste it into a new email to info@hrm-solutions.com.";
    } catch {
      draft.focus(); draft.select();
      copyStatus.textContent = "Select and copy the draft above, then paste it into your email app.";
    }
  });
}
