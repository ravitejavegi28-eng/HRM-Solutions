const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const header = document.querySelector("[data-header]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const viewSections = document.querySelectorAll("[data-view]");
const routedLinks = document.querySelectorAll('a[href^="#"]');
const validViews = new Set(Array.from(viewSections, (section) => section.dataset.view));
const viewTitles = {
  home: "HR Software & US Staffing",
  product: "HR Software",
  solutions: "HR Software by Industry",
  why: "US Staffing Services",
  pricing: "HR Software Pricing",
  resources: "HR & Hiring Guides",
  about: "About Us",
  contact: "Let's Talk"
};
const enquiryForm = document.querySelector("[data-enquiry-form]");
const enquiryResult = document.querySelector("[data-enquiry-result]");
const enquiryStatus = document.querySelector("[data-enquiry-status]");
const enquiryDraft = document.querySelector("#enquiry-draft");
const emailDraftLink = document.querySelector("[data-email-draft]");
const copyStatus = document.querySelector("[data-copy-status]");

const clearDraft = () => {
  enquiryResult.hidden = true;
  enquiryDraft.value = "";
  emailDraftLink.href = "mailto:info@hrm-solutions.com";
  enquiryStatus.textContent = "";
  copyStatus.textContent = "";
};

if (enquiryForm) {
  enquiryForm.hidden = false;
  enquiryForm.addEventListener("input", (event) => {
    event.target.setCustomValidity?.("");
    clearDraft();
  });
  enquiryForm.addEventListener("change", clearDraft);
  enquiryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    for (const field of enquiryForm.querySelectorAll("[required]")) {
      field.setCustomValidity(field.value.trim() ? "" : "Please complete this field.");
    }
    if (!enquiryForm.reportValidity()) return;

    const data = new FormData(enquiryForm);
    const value = (key) => String(data.get(key) || "").trim();
    const subject = `${value("interest")} enquiry${value("company") ? ` — ${value("company")}` : ""}`;
    const body = [
      "Hello HRM-Solutions,", "",
      `I'm interested in: ${value("interest")}`, "",
      value("message"), "",
      `Name: ${value("name")}`,
      `Email: ${value("email")}`,
      ...(value("company") ? [`Company: ${value("company")}`] : [])
    ].join("\n");
    enquiryDraft.value = `To: info@hrm-solutions.com\nSubject: ${subject}\n\n${body}`;
    emailDraftLink.href = `mailto:info@hrm-solutions.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    enquiryResult.hidden = false;
    enquiryStatus.textContent = "Your draft is ready. Review it below, then open your email app to send it.";
    copyStatus.textContent = "";
  });
  document.querySelector("[data-copy-enquiry]")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(enquiryDraft.value);
      copyStatus.textContent = "Email text copied. Paste it into a new email to info@hrm-solutions.com.";
    } catch {
      enquiryDraft.focus();
      enquiryDraft.select();
      copyStatus.textContent = "Select and copy the draft above, then paste it into your email app.";
    }
  });
}

document.body.classList.add("has-view-routing");

if (window.lucide) {
  window.lucide.createIcons();
}

navToggle?.addEventListener("click", () => {
  const isOpen = nav?.classList.toggle("is-open");
  document.body.classList.toggle("nav-open", Boolean(isOpen));
  navToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
  navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});

const closeNavigation = () => {
  nav?.classList.remove("is-open");
  document.body.classList.remove("nav-open");
  navToggle?.setAttribute("aria-expanded", "false");
  navToggle?.setAttribute("aria-label", "Open navigation");
};

const getViewFromHash = (hash) => {
  const requestedView = hash.replace(/^#/, "");
  return validViews.has(requestedView) ? requestedView : "home";
};

const showView = (view, shouldFocus = false) => {
  document.title = `${viewTitles[view]} | HRM-Solutions`;
  document.body.dataset.currentView = view;
  viewSections.forEach((section) => {
    const isActive = section.dataset.view === view;
    section.classList.toggle("is-active-view", isActive);
    section.setAttribute("aria-hidden", String(!isActive));
  });

  routedLinks.forEach((link) => {
    const linkView = getViewFromHash(link.hash);
    const isPrimaryNavLink = link.closest("[data-nav]");

    if (isPrimaryNavLink && linkView === view) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  closeNavigation();
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });

  if (shouldFocus) {
    const activeHeading = document.querySelector(`[data-view="${view}"].is-active-view h1, [data-view="${view}"].is-active-view h2`);
    activeHeading?.setAttribute("tabindex", "-1");
    activeHeading?.focus({ preventScroll: true });
  }
};

document.addEventListener("click", (event) => {
  const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;

  if (link?.hash === "#main-content") {
    event.preventDefault();
    document.querySelector("#main-content")?.focus();
    return;
  }

  if (!link || !validViews.has(link.hash.slice(1))) {
    return;
  }

  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  if (link.dataset.interest && enquiryForm) {
    enquiryForm.elements.interest.value = link.dataset.interest;
    clearDraft();
  }

  event.preventDefault();
  const view = getViewFromHash(link.hash);

  if (window.location.hash === `#${view}`) {
    showView(view, true);
  } else {
    window.location.hash = view;
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && nav?.classList.contains("is-open")) {
    closeNavigation();
    navToggle?.focus();
  }
});

document.addEventListener("click", (event) => {
  if (event.target instanceof Node && !header?.contains(event.target)) closeNavigation();
});

window.matchMedia("(min-width: 1120px)").addEventListener("change", closeNavigation);

window.addEventListener("hashchange", () => {
  showView(getViewFromHash(window.location.hash), true);
});

window.addEventListener("scroll", () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 10);
});

const initialView = getViewFromHash(window.location.hash);
if (!window.location.hash || !validViews.has(window.location.hash.slice(1))) {
  window.history.replaceState(null, "", `#${initialView}`);
}
showView(initialView);
