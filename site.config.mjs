export const site = {
  origin: "https://www.hrm-solutions.com",
  name: "HRM-Solutions",
  email: "info@hrm-solutions.com",
  phone: "+1 732-344-3416",
  updated: "2026-10-03"
};

export const pages = [
  { slug: "", source: "home", nav: "Home", title: "US Staffing & Software Implementation | HRM-Solutions", description: "HRM-Solutions supports US hiring and software implementation for business owners, project managers, and partners in Jersey City and Hyderabad." },
  { slug: "us-staffing", source: "staffing", nav: "US staffing", title: "US Staffing & Recruitment Services | HRM-Solutions", description: "Share your US job requirements with HRM-Solutions. Discuss candidate sourcing, screening, and hiring coordination with our Jersey City staffing team.", service: "US staffing and recruitment", area: ["United States"] },
  { slug: "software-implementation", source: "implementation", nav: "Software implementation", title: "Software Implementation in US & India | HRM-Solutions", description: "Plan your software implementation with HRM-Solutions. Support for requirements, rollout, and adoption for businesses in the US and Hyderabad, India.", service: "Software implementation", area: ["United States", "India"] },
  { slug: "resources", source: "resources", nav: "Resources", title: "Hiring & Software Implementation Guides | HRM-Solutions", description: "Prepare a US hiring brief or software rollout plan with practical checklists for project managers, business partners, and business owners." },
  { slug: "about", source: "about", nav: "About", title: "About HRM-Solutions | US Staffing & Implementation", description: "Learn about HRM-Solutions and our focus on US staffing and software implementation for business decision-makers in Jersey City and Hyderabad." },
  { slug: "contact", source: "contact", nav: "Request support", title: "Request Hiring or Implementation Support | HRM-Solutions", description: "Contact HRM-Solutions to share US job requirements or discuss a software implementation project. Serving clients in the United States and India." }
];

export const pagePath = (page) => page.slug ? `/${page.slug}/` : "/";
