import { connectDB } from "./db";
import { getProfile } from "../services/profile.service";
import { getPublicServices } from "../services/service.service";
import { getPublicCaseStudies } from "../services/caseStudy.service";
import { getPublicFaqs } from "../services/faq.service";
import { getPublicPortfolio } from "../services/portfolio.service";
import { getPublicPrices } from "../services/price.service";
import { getPublicReviews } from "../services/review.service";
import { listBlogs } from "../services/blog.service";
import {
  DEFAULT_CASE_STUDIES,
  DEFAULT_FAQS,
  DEFAULT_PLANS,
  DEFAULT_PORTFOLIO,
  DEFAULT_PROFILE,
  DEFAULT_REVIEWS,
  DEFAULT_SERVICES,
} from "./defaults";
import type {
  IBlog,
  ICaseStudy,
  IFaq,
  IPortfolio,
  IPrice,
  IProfile,
  IReview,
  IService,
} from "../types";

export type HomeData = {
  profile: IProfile;
  services: IService[];
  caseStudies: ICaseStudy[];
  portfolio: IPortfolio[];
  plans: IPrice[];
  reviews: IReview[];
  faqs: IFaq[];
  posts: IBlog[];
};

/** Mongo documents carry ObjectIds and Dates — Server Components can only
 *  hand plain JSON to the client, so we normalise once here. */
const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** Uses live content when the collection has rows, otherwise the seeded defaults. */
const orDefault = <T>(rows: T[], fallback: T[]): T[] =>
  rows.length ? rows : fallback;

/**
 * Loads everything the home page renders in one pass, straight from the
 * service layer — no HTTP round trip back into our own API.
 *
 * Any single collection failing degrades to its default rather than taking
 * the whole page down.
 */
export async function getHomeData(): Promise<HomeData> {
  try {
    await connectDB();
  } catch {
    // No database configured (e.g. a fresh clone) — render the demo content.
    return plain({
      profile: DEFAULT_PROFILE,
      services: DEFAULT_SERVICES,
      caseStudies: DEFAULT_CASE_STUDIES,
      portfolio: DEFAULT_PORTFOLIO,
      plans: DEFAULT_PLANS,
      reviews: DEFAULT_REVIEWS,
      faqs: DEFAULT_FAQS,
      posts: [],
    });
  }

  const settled = await Promise.allSettled([
    getProfile(),
    getPublicServices(),
    getPublicCaseStudies(),
    getPublicPortfolio(),
    getPublicPrices(),
    getPublicReviews(),
    getPublicFaqs(),
    listBlogs({ limit: 4 }).then((r) => r.data),
  ]);

  const pick = <T>(index: number, fallback: T): T =>
    settled[index].status === "fulfilled"
      ? ((settled[index] as PromiseFulfilledResult<T>).value ?? fallback)
      : fallback;

  return plain({
    profile: pick(0, DEFAULT_PROFILE),
    services: orDefault(pick<IService[]>(1, []), DEFAULT_SERVICES),
    caseStudies: orDefault(pick<ICaseStudy[]>(2, []), DEFAULT_CASE_STUDIES),
    portfolio: orDefault(pick<IPortfolio[]>(3, []), DEFAULT_PORTFOLIO),
    plans: orDefault(pick<IPrice[]>(4, []), DEFAULT_PLANS),
    reviews: orDefault(pick<IReview[]>(5, []), DEFAULT_REVIEWS),
    faqs: orDefault(pick<IFaq[]>(6, []), DEFAULT_FAQS),
    posts: pick<IBlog[]>(7, []),
  });
}

/** Profile only — used by the layout for metadata and the footer. */
export async function getSiteProfile(): Promise<IProfile> {
  try {
    await connectDB();
    return plain(await getProfile());
  } catch {
    return DEFAULT_PROFILE;
  }
}
