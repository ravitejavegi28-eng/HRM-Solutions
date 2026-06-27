const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const header = document.querySelector("[data-header]");
const form = document.querySelector("[data-demo-form]");
const formNote = document.querySelector("[data-form-note]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const viewSections = document.querySelectorAll("[data-view]");
const routedLinks = document.querySelectorAll('a[href^="#"]');
const validViews = new Set(Array.from(viewSections, (section) => section.dataset.view));

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

  if (!link || !validViews.has(link.hash.slice(1))) {
    return;
  }

  event.preventDefault();
  const view = getViewFromHash(link.hash);

  if (window.location.hash === `#${view}`) {
    showView(view, true);
  } else {
    window.location.hash = view;
  }
});

window.addEventListener("hashchange", () => {
  showView(getViewFromHash(window.location.hash), true);
});

window.addEventListener("scroll", () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 10);
});

const revealSelectors = [
  ".section-heading",
  ".comparison-card",
  ".feature-card",
  ".industry-card",
  ".diff-card",
  ".process-card",
  ".metric-block",
  ".testimonial-card",
  ".price-card",
  ".resource-card",
  ".timeline-strip > div",
  ".career-callout",
  ".demo-form"
];

const revealElements = document.querySelectorAll(revealSelectors.join(","));

if (prefersReducedMotion) {
  revealElements.forEach((element) => element.classList.add("is-visible"));
} else {
  revealElements.forEach((element, index) => {
    element.classList.add("reveal-on-scroll");
    element.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 70}ms`);
  });

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  form.reset();
  if (formNote) {
    formNote.textContent = "Thanks. We will contact you shortly to schedule your HRM demo.";
    formNote.classList.add("is-success");
  }
});

const initialView = getViewFromHash(window.location.hash);
if (!window.location.hash || !validViews.has(window.location.hash.slice(1))) {
  window.history.replaceState(null, "", `#${initialView}`);
}
showView(initialView);
