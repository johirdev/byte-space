import type { Metadata } from "next";
import { SITE } from "./site";

type PageSeo = {
  title: string;
  description?: string;
  /** Route path, used for the canonical URL and og:url. */
  path: string;
  /** Absolute or root-relative image URLs; defaults to the generated social card. */
  images?: string[];
  /** Private or per-user screens: keep them out of search results. */
  noindex?: boolean;
  type?: "website" | "article" | "profile";
};

/**
 * Builds a page's metadata. Next merges metadata shallowly, so a page that
 * sets `openGraph` replaces the root one entirely. This helper always emits
 * complete Open Graph / Twitter blocks with the right URL and title.
 */
export function pageMetadata({
  title,
  description = SITE.description,
  path,
  images,
  noindex = false,
  type = "website",
}: PageSeo): Metadata {
  const socialTitle = `${title} | ${SITE.name}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: SITE.name,
      locale: SITE.locale,
      url: path,
      title: socialTitle,
      description,
      ...(images?.length ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      ...(images?.length ? { images } : {}),
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
