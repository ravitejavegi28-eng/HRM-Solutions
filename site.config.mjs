export const site = {
  origin: "https://www.hrm-solutions.com",
  name: "HRM-Solutions",
  email: "info@hrm-solutions.com",
  phone: "+1 732-344-3416",
  updated: "2026-10-08"
};

export const pages = [
  { slug: "", source: "home", nav: "Home", title: "US IT Staffing & Recruitment | HRM-Solutions", description: "US IT staffing for contract, contract-to-hire, and direct-hire roles. HRM-Solutions connects US employers with qualified technology professionals." },
  { slug: "us-staffing", source: "staffing", nav: "US staffing", title: "US IT Staffing Services | Contract & Direct Hire | HRM-Solutions", description: "Find contract, contract-to-hire, and direct-hire IT talent across the United States. Discuss sourcing, screening, and recruitment with HRM-Solutions.", service: "US IT staffing and recruitment", area: ["United States"] },
  { slug: "software-implementation", source: "implementation", nav: "Software implementation", title: "Software & HRM Implementation Services | HRM-Solutions", description: "Plan software and HRM implementation with HRM-Solutions. Discuss platform requirements, rollout, adoption, and selected technology consulting services.", service: "Software implementation", area: ["United States", "India"] },
  { slug: "resources", source: "resources", nav: "Resources", title: "Hiring & Software Implementation Guides | HRM-Solutions", description: "Prepare a US hiring brief or software rollout plan with practical checklists for project managers, business partners, and business owners." },
  { slug: "about", source: "about", nav: "About", title: "About HRM-Solutions | US Staffing & Implementation", description: "Learn about HRM-Solutions and our focus on US staffing and software implementation for business decision-makers in Jersey City and Hyderabad." },
  { slug: "contact", source: "contact", nav: "Staffing enquiry", title: "Request Hiring or Implementation Support | HRM-Solutions", description: "Contact HRM-Solutions to share US job requirements or discuss a software implementation project. Serving clients in the United States and India." }
];

export const pagePath = (page) => page.slug ? `/${page.slug}/` : "/";
