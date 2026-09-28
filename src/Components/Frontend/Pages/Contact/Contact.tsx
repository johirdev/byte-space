import Link from "next/link";
import { ArrowRight, BookOpen, Clock, HelpCircle, Mail, MapPin, Phone, Sparkles } from "lucide-react";
import { SITE_CONTACT } from "@/config/site";
import PageHero from "../../Shared/PageHero";
import Reveal from "../../Shared/Reveal";
import Faq from "../Home/Faq/Faq";
import ContactForm from "./ContactForm";

const CHANNELS = [
  { icon: Mail, title: "Email us", value: SITE_CONTACT.email, href: `mailto:${SITE_CONTACT.email}`, note: SITE_CONTACT.responseTime },
  { icon: Phone, title: "Call us", value: SITE_CONTACT.phone, href: SITE_CONTACT.phoneHref, note: "For urgent account or payment issues." },
  { icon: MapPin, title: "Visit us", value: SITE_CONTACT.address, href: SITE_CONTACT.mapUrl, note: "Open in Google Maps", external: true },
  { icon: Clock, title: "Support hours", value: SITE_CONTACT.hours, note: "Messages outside hours are answered next business day." },
];

const SHORTCUTS = [
  { icon: HelpCircle, title: "Read the FAQ", text: "Quick answers about enrolling, payments and your account.", href: "#faq" },
  { icon: BookOpen, title: "Browse courses", text: "Find your next skill in our growing catalogue.", href: "/courses" },
  { icon: Sparkles, title: "Become a creator", text: "Apply to teach and share your expertise.", href: "/become-creator" },
];

export default function Contact() {
  return (
    <main>
      <PageHero
        title="Contact Us"
        subtitle="Questions about a course, a payment or teaching on ByteSpace? We're here to help."
        crumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
      />

      <section className="container-site grid items-start gap-8 py-12 md:py-20 lg:grid-cols-12 lg:gap-10">
        {/* ── Channels ─────────────────────────────────────── */}
        <div className="space-y-4 lg:col-span-5">
          {CHANNELS.map((c, i) => {
            const inner = (
              <>
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-secondary-400 text-neutral-950 transition-transform duration-300 group-hover:scale-110">
                  <c.icon className="size-6" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm text-neutral-500">{c.title}</span>
                  <span className="mt-0.5 block font-medium break-words text-neutral-950">{c.value}</span>
                  <span className="mt-1 block text-sm text-neutral-500">{c.note}</span>
                </span>
              </>
            );
            return (
              <Reveal key={c.title} delay={i * 0.06}>
                {c.href ? (
                  <a
                    href={c.href}
                    {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="group flex gap-4 rounded-2xl border border-neutral-100 bg-white p-5 transition-[border-color,box-shadow] duration-300 hover:border-transparent hover:shadow-card-hover"
                  >
                    {inner}
                  </a>
                ) : (
                  <div className="group flex gap-4 rounded-2xl border border-neutral-100 bg-white p-5">{inner}</div>
                )}
              </Reveal>
            );
          })}

          <Reveal delay={0.3} className="bg-hero-grid rounded-2xl p-6">
            <p className="font-heading text-lg font-semibold text-white">Follow ByteSpace</p>
            <p className="mt-1 text-sm text-white/80">New courses, creator stories and learning tips.</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {SITE_CONTACT.socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center rounded-full border border-white/40 px-4 text-sm text-white transition-colors hover:border-secondary-400 hover:bg-secondary-400 hover:text-neutral-950"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* ── Form ─────────────────────────────────────────── */}
        <Reveal delay={0.1} className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-card md:p-10 lg:col-span-7">
          <h2 className="font-heading text-2xl font-semibold text-neutral-950 md:text-3xl">Send us a message</h2>
          <p className="mt-2 mb-8 text-neutral-600">Fill in the form and we&apos;ll get back to you at the email you provide.</p>
          <ContactForm />
        </Reveal>
      </section>

      {/* ── Shortcuts ───────────────────────────────────────── */}
      <section className="container-site pb-4">
        <ul className="grid gap-4 md:grid-cols-3">
          {SHORTCUTS.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 0.08}>
              <Link
                href={s.href}
                className="group flex h-full items-start gap-4 rounded-2xl bg-neutral-50 p-6 transition-colors duration-300 hover:bg-primary-50"
              >
                <s.icon className="mt-0.5 size-6 shrink-0 text-primary-600" aria-hidden="true" />
                <span className="flex-1">
                  <span className="flex items-center gap-2 font-medium text-neutral-950">
                    {s.title}
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                  <span className="mt-1 block text-sm text-neutral-600">{s.text}</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ── FAQ (same content as the home page, managed in the dashboard) ── */}
      <div id="faq" className="scroll-mt-24">
        <Faq />
      </div>
    </main>
  );
}
