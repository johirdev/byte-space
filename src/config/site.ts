/**
 * Site-wide SEO identity. Every metadata export, the sitemap, robots.txt,
 * the web manifest and JSON-LD read from here, so the brand is defined once.
 */
const FALLBACK_URL = "https://bytespacebd.vercel.app";

/** Absolute origin without a trailing slash. NEXT_PUBLIC_SITE_URL wins when set. */
const resolveSiteUrl = () => {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  // A localhost value in a production build would poison canonicals and the sitemap.
  if (!raw || (process.env.NODE_ENV === "production" && raw.includes("localhost"))) {
    return FALLBACK_URL;
  }
  return raw.replace(/\/+$/, "");
};

export const SITE = {
  name: "ByteSpace",
  url: resolveSiteUrl(),
  title: "ByteSpace — Learn Practical Skills from Verified Creators",
  description:
    "ByteSpace is an online course marketplace where verified creators teach practical, career-ready skills. Browse courses in design, development, marketing and business, learn at your own pace and track your progress.",
  keywords: [
    "ByteSpace",
    "online courses",
    "online learning platform",
    "course marketplace",
    "learn online Bangladesh",
    "verified creators",
    "web development course",
    "UI UX design course",
    "digital marketing course",
    "skill development",
    "e-learning",
  ],
  locale: "en_US",
  themeColor: "#0445ff",
  author: { name: "Johir", url: "https://github.com/johirdev" },
} as const;

/** Resolves a path against the site origin: absoluteUrl("/courses") → https://…/courses */
export const absoluteUrl = (path = "/") =>
  new URL(path, `${SITE.url}/`).toString();

/**
 * Public contact details shown on the Contact page (and anywhere else that
 * needs them). Replace these placeholders with your real details.
 */
export const SITE_CONTACT = {
  email: "support@bytespace.com",
  phone: "+880 1700-000000",
  phoneHref: "tel:+8801700000000",
  address: "House 12, Road 5, Dhanmondi, Dhaka 1205, Bangladesh",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Dhanmondi+Dhaka+Bangladesh",
  hours: "Sunday – Thursday, 10:00 AM – 7:00 PM (GMT+6)",
  responseTime: "We reply within 24 hours on business days.",
  socials: [
    { label: "Facebook", href: "https://facebook.com" },
    { label: "LinkedIn", href: "https://linkedin.com" },
    { label: "YouTube", href: "https://youtube.com" },
    { label: "Instagram", href: "https://instagram.com" },
  ],
} as const;
