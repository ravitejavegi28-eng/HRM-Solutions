const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const header = document.querySelector("[data-header]");
const form = document.querySelector("[data-demo-form]");
const formNote = document.querySelector("[data-form-note]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (window.lucide) {
  window.lucide.createIcons();
}

navToggle?.addEventListener("click", () => {
  const isOpen = nav?.classList.toggle("is-open");
  document.body.classList.toggle("nav-open", Boolean(isOpen));
  navToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
  navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});

nav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    nav.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.setAttribute("aria-label", "Open navigation");
  }
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
