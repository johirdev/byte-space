import type {
  ICaseStudy,
  IFaq,
  IPortfolio,
  IPrice,
  IProfile,
  IReview,
  IService,
} from "../types";

/**
 * Seed / fallback content.
 *
 * Every public section renders from the API, but an empty collection should
 * never produce an empty page — these defaults keep the site presentable
 * before the admin has filled anything in, and double as the seed payload
 * for `POST /api/v1/seed`.
 */

export const DEFAULT_PROFILE: IProfile = {
  full_name: "Anamul Hasan Nafi",
  short_name: "Nafi",
  headline: "I turn ad spend into predictable, profitable growth.",
  roles: [
    "Performance Marketing Specialist",
    "Meta Ads Strategist",
    "Google Ads Expert",
    "Conversion Tracking Engineer",
    "Lead Generation Consultant",
  ],
  bio: "Digital Marketing Specialist with 3+ years running paid acquisition for e-commerce, local service and SaaS brands. I build full-funnel ad systems on Meta, Google, YouTube and TikTok — backed by server-side tracking that actually reports the truth.",
  long_bio:
    "I started out managing small local campaigns and learned the hard way that creative alone does not scale — measurement does. Today I run paid media as a system: clean tracking first, a structured testing plan second, and scale only where the numbers hold. That approach has taken clients from break-even to 4x+ blended ROAS without inflating budgets.",
  avatar: "/Anamul_Hasan.png",
  resume_url: "/anamul_hasan_rafi.pdf",
  intro_video_url: "",
  email: "hello@anamulhasannafi.com",
  phone: "+8801700000000",
  whatsapp: "+8801700000000",
  location: "Dhaka, Bangladesh · Working worldwide",
  availability: "Available for new projects",
  hourly_rate: 25,

  stats: [
    { value: "3+", label: "Years in paid media" },
    { value: "48+", label: "Clients served" },
    { value: "$1.2M+", label: "Ad spend managed" },
    { value: "4.3x", label: "Average blended ROAS" },
  ],

  skills: [
    { label: "Meta Ads (Facebook & Instagram)", level: 95 },
    { label: "Google Ads (Search, PMax, Shopping)", level: 92 },
    { label: "YouTube & Video Ads", level: 90 },
    { label: "Pixel, GTM & Conversions API", level: 93 },
    { label: "TikTok & Pinterest Ads", level: 84 },
    { label: "Funnel Strategy & Lead Gen", level: 88 },
    { label: "GA4 & Looker Studio Reporting", level: 86 },
  ],

  tools: [
    "Meta Ads Manager",
    "Google Ads",
    "Google Tag Manager",
    "GA4",
    "Looker Studio",
    "TikTok Ads Manager",
    "Conversions API",
    "Shopify",
    "WordPress",
    "Klaviyo",
    "Canva",
    "Photoshop",
  ],

  socials: [
    { platform: "linkedin", url: "https://linkedin.com" },
    { platform: "facebook", url: "https://facebook.com" },
    { platform: "youtube", url: "https://youtube.com" },
    { platform: "whatsapp", url: "https://wa.me/8801700000000" },
  ],

  process: [
    {
      title: "Audit & Measurement",
      description:
        "I start with what is already there — account structure, pixel health, GA4, attribution. You get a written audit before a single dollar moves.",
    },
    {
      title: "Strategy & Offer",
      description:
        "Funnel mapped end to end: audience, offer, creative angles, landing page. We agree on the target CPA/ROAS before launch, not after.",
    },
    {
      title: "Build & Launch",
      description:
        "Clean campaign architecture, server-side tracking via Conversions API, and a structured creative testing plan from day one.",
    },
    {
      title: "Optimise & Scale",
      description:
        "Weekly optimisation cycles on the metrics that move profit. Budget scales only where the unit economics already work.",
    },
    {
      title: "Report & Iterate",
      description:
        "A live Looker Studio dashboard plus a plain-English weekly summary — what changed, what it cost, what is next.",
    },
  ],

  experience: [
    {
      title: "CEO & Founder",
      organization: "CreatoBee Agency",
      period: "2023 — Present",
      description: "Full-service performance marketing agency.",
      points: [
        "Built and scaled a paid-media agency serving clients across 6 countries.",
        "Own strategy, tracking architecture and creative direction across all accounts.",
        "Manage recurring monthly retainers with a 90%+ client retention rate.",
      ],
    },
    {
      title: "Digital Marketing Specialist",
      organization: "Freelance & Remote",
      period: "2022 — Present",
      description: "Direct-to-client paid acquisition work.",
      points: [
        "Delivered 60+ campaigns across Meta, Google, YouTube, TikTok and Pinterest.",
        "Specialised in Pixel + Conversions API setups that survived iOS attribution loss.",
        "Cut client cost-per-lead by 35–60% on average within the first 60 days.",
      ],
    },
  ],

  education: [
    {
      title: "BBA in Marketing",
      organization: "National University, Bangladesh",
      period: "2019 — 2023",
      description: "Focus on consumer behaviour and brand strategy.",
      points: [],
    },
  ],

  certifications: [
    { title: "Meta Certified Digital Marketing Associate", issuer: "Meta", year: "2023" },
    { title: "Google Ads Search Certification", issuer: "Google Skillshop", year: "2024" },
    { title: "Google Analytics 4 Certification", issuer: "Google Skillshop", year: "2024" },
    { title: "TikTok Media Buying Certification", issuer: "TikTok Academy", year: "2024" },
  ],

  client_logos: [],

  seo_title: "Anamul Hasan Nafi — Performance Marketing & Paid Ads Specialist",
  seo_description:
    "Meta Ads, Google Ads, YouTube & TikTok campaigns backed by server-side conversion tracking. 3+ years, 48+ clients, 4.3x average blended ROAS.",
  seo_keywords: [
    "Anamul Hasan Nafi",
    "performance marketing specialist",
    "Meta Ads expert",
    "Google Ads expert",
    "Facebook Ads Bangladesh",
    "conversions API setup",
    "lead generation consultant",
    "digital marketer portfolio",
  ],
};

export const DEFAULT_SERVICES: IService[] = [
  {
    title: "Meta Ads Management",
    tagline: "Facebook & Instagram campaigns built to sell, not just reach.",
    description:
      "Full-funnel Meta advertising — cold traffic acquisition through retargeting — with a structured creative testing plan and clean CBO/ABO architecture.",
    icon: "meta",
    deliverables: [
      "Account audit & rebuild",
      "Pixel + Conversions API setup",
      "Creative testing framework",
      "Audience & exclusion strategy",
      "Weekly optimisation & reporting",
    ],
    starting_price: 400,
    timeline: "Live in 5–7 days",
    outcome: "Avg. 4.1x ROAS",
    featured: true,
    is_active: true,
    order: 1,
  },
  {
    title: "Google Ads & Shopping",
    tagline: "Capture the demand that is already searching for you.",
    description:
      "Search, Performance Max and Shopping campaigns with tight keyword control, negative lists and conversion-value bidding tuned to your margins.",
    icon: "google",
    deliverables: [
      "Keyword & competitor research",
      "Search + PMax build",
      "Merchant Center & feed setup",
      "Negative keyword hygiene",
      "Bid strategy & budget pacing",
    ],
    starting_price: 450,
    timeline: "Live in 7–10 days",
    outcome: "−38% avg. CPA",
    featured: true,
    is_active: true,
    order: 2,
  },
  {
    title: "Conversion Tracking & CAPI",
    tagline: "Stop optimising toward numbers that are wrong.",
    description:
      "Server-side tracking done properly: GTM containers, Conversions API, GA4 events, deduplication and a verified end-to-end data flow.",
    icon: "analytics",
    deliverables: [
      "GTM server-side container",
      "Meta Conversions API",
      "GA4 event & funnel mapping",
      "Event deduplication QA",
      "Looker Studio dashboard",
    ],
    starting_price: 300,
    timeline: "3–5 days",
    outcome: "95%+ event match quality",
    featured: true,
    is_active: true,
    order: 3,
  },
  {
    title: "Lead Generation Funnels",
    tagline: "A predictable pipeline of qualified enquiries.",
    description:
      "Offer, landing page, ad set and follow-up sequence designed as one system — with lead quality scoring so sales are not chasing noise.",
    icon: "funnel",
    deliverables: [
      "Offer & angle development",
      "Landing page copy direction",
      "Lead form & CRM wiring",
      "Qualification filters",
      "Follow-up email sequence",
    ],
    starting_price: 500,
    timeline: "10–14 days",
    outcome: "−52% cost per lead",
    featured: false,
    is_active: true,
    order: 4,
  },
  {
    title: "YouTube & TikTok Video Ads",
    tagline: "Short-form video that earns the click.",
    description:
      "Hook-first video advertising across YouTube and TikTok, with scripting support, placement strategy and view-through attribution.",
    icon: "youtube",
    deliverables: [
      "Hook & script direction",
      "Campaign build & placements",
      "Audience layering",
      "View-through measurement",
      "Creative refresh cadence",
    ],
    starting_price: 380,
    timeline: "5–7 days",
    outcome: "3.2x view-through lift",
    featured: false,
    is_active: true,
    order: 5,
  },
  {
    title: "Growth Consulting & Audits",
    tagline: "A second pair of eyes on the whole growth engine.",
    description:
      "A written audit of accounts, tracking and funnel economics, plus a prioritised 90-day roadmap you can hand to any team.",
    icon: "consulting",
    deliverables: [
      "Full account audit",
      "Tracking health report",
      "Unit economics review",
      "90-day growth roadmap",
      "Live strategy session",
    ],
    starting_price: 250,
    timeline: "5 business days",
    outcome: "Actionable in week 1",
    featured: false,
    is_active: true,
    order: 6,
  },
];

export const DEFAULT_CASE_STUDIES: ICaseStudy[] = [
  {
    title: "Scaling a DTC skincare brand from break-even to 4.6x ROAS",
    client_name: "Glowline",
    industry: "E-commerce · Skincare",
    cover_image:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80",
    summary:
      "Rebuilt a leaking Meta account, fixed a broken pixel and shifted budget onto three creative angles that carried the whole account.",
    challenge:
      "The account was spending $9k/month at roughly break-even. The pixel was double-firing purchases, so reported ROAS was inflated by ~40% and optimisation was chasing phantom conversions.",
    approach:
      "Rebuilt tracking with server-side Conversions API and deduplication, consolidated 14 ad sets into 3 CBO campaigns, and ran a structured 6-angle creative test at low budget before scaling winners.",
    result:
      "Within 90 days, verified blended ROAS reached 4.6x on 2.1x the previous budget, with cost per purchase down 44%.",
    channels: ["Meta Ads", "Conversions API", "Creative Testing"],
    metrics: [
      { label: "Blended ROAS", before: "1.1x", after: "4.6x", delta: "+318%", trend: "up" },
      { label: "Cost per purchase", before: "$41", after: "$23", delta: "−44%", trend: "down" },
      { label: "Monthly ad spend", before: "$9K", after: "$19K", delta: "+111%", trend: "up" },
      { label: "Event match quality", before: "4.1", after: "8.7", delta: "+112%", trend: "up" },
    ],
    duration: "90 days",
    ad_spend: 57000,
    featured: true,
    is_active: true,
    order: 1,
  },
  {
    title: "Cutting cost per lead by 61% for a B2B services firm",
    client_name: "Northbridge Consulting",
    industry: "B2B · Professional services",
    cover_image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
    summary:
      "Replaced a broad awareness strategy with a qualified-lead funnel and a hard filter on who could actually book.",
    challenge:
      "Leads were cheap but unqualified — sales closed under 2%. The client was measuring form fills instead of booked calls.",
    approach:
      "Moved the conversion event to booked-call, added qualification questions to the form, rewrote ad angles around a specific pain point, and reported on cost-per-booked-call rather than cost-per-lead.",
    result:
      "Raw lead volume dropped 30%, but booked calls rose 84% and cost per qualified lead fell 61%.",
    channels: ["Google Ads", "LinkedIn", "GA4"],
    metrics: [
      { label: "Cost per qualified lead", before: "$180", after: "$70", delta: "−61%", trend: "down" },
      { label: "Booked calls / month", before: "12", after: "22", delta: "+84%", trend: "up" },
      { label: "Lead-to-close rate", before: "1.8%", after: "9.4%", delta: "+422%", trend: "up" },
    ],
    duration: "120 days",
    ad_spend: 34000,
    featured: true,
    is_active: true,
    order: 2,
  },
  {
    title: "Launching a local service business to 140 bookings/month",
    client_name: "PureAir HVAC",
    industry: "Local services · HVAC",
    cover_image:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80",
    summary:
      "Zero-to-one launch: geo-fenced search campaigns, call tracking, and seasonal budget pacing around demand spikes.",
    challenge:
      "A new market entrant with no historic data, no reviews and a limited $2k/month budget competing against established local players.",
    approach:
      "Started with high-intent exact-match search only, layered call tracking to prove revenue attribution, then expanded into Performance Max once conversion data was sufficient.",
    result:
      "Reached 140 booked jobs per month by month five while keeping cost per booking under $18.",
    channels: ["Google Ads", "Local Services", "Call Tracking"],
    metrics: [
      { label: "Booked jobs / month", before: "0", after: "140", delta: "New", trend: "up" },
      { label: "Cost per booking", after: "$17.40", delta: "Under target", trend: "down" },
      { label: "Return on ad spend", after: "6.2x", delta: "+6.2x", trend: "up" },
    ],
    duration: "5 months",
    ad_spend: 11000,
    featured: false,
    is_active: true,
    order: 3,
  },
];

export const DEFAULT_FAQS: IFaq[] = [
  {
    question: "What does it cost to work with you?",
    answer:
      "Management retainers start at $400/month for a single channel and scale with ad spend and complexity. One-off work — audits, tracking setups, funnel builds — is quoted as a fixed project fee. You will always see the number before anything starts.",
    category: "Pricing",
    is_active: true,
    order: 1,
  },
  {
    question: "Is the ad budget included in your fee?",
    answer:
      "No. My fee covers strategy, build, optimisation and reporting. The ad spend goes directly to Meta, Google or TikTok from your own billing account, so you keep full ownership and visibility of every dollar.",
    category: "Pricing",
    is_active: true,
    order: 2,
  },
  {
    question: "How quickly will I see results?",
    answer:
      "Tracking and account rebuilds land in the first week. Meaningful performance signal usually appears in 2–4 weeks once the algorithm has enough conversion data, and the compounding gains show from month two onward.",
    category: "Process",
    is_active: true,
    order: 3,
  },
  {
    question: "Do you take ownership of my ad accounts?",
    answer:
      "Never. I work inside your Business Manager and your Google Ads account with the access level you grant. If we part ways, everything — data, creatives, campaign history — stays with you.",
    category: "Process",
    is_active: true,
    order: 4,
  },
  {
    question: "What do you need from me to get started?",
    answer:
      "Admin access to your ad accounts and website, whatever creative assets you already have, and 45 minutes for a kickoff call covering your margins and what a good customer is actually worth to you.",
    category: "Process",
    is_active: true,
    order: 5,
  },
  {
    question: "Do you work with small budgets?",
    answer:
      "Yes, down to about $1,000/month in ad spend. Below that, paid social rarely gathers enough conversion data to optimise, and I will tell you honestly if a one-off audit or organic work would serve you better first.",
    category: "Pricing",
    is_active: true,
    order: 6,
  },
  {
    question: "Which industries do you work with?",
    answer:
      "Mostly e-commerce, local service businesses and B2B services. I turn down accounts in categories I cannot ethically or legally advertise, and I say no if I do not think I can beat what you already have.",
    category: "General",
    is_active: true,
    order: 7,
  },
  {
    question: "How do you report on performance?",
    answer:
      "A live Looker Studio dashboard you can open any time, plus a short weekly written summary: what changed, what it cost, what the numbers say, and what happens next week. No vanity metrics.",
    category: "Reporting",
    is_active: true,
    order: 8,
  },
];

export const DEFAULT_PLANS: IPrice[] = [
  {
    price_heading: "Starter",
    price_amount: 400,
    currency: "USD",
    billing_period: "monthly",
    description: "One channel, done properly. Best for brands under $5k/mo ad spend.",
    active_mostpopular: false,
    contact: "https://wa.me/8801700000000",
    cta_label: "Start with one channel",
    features: [
      "1 advertising channel",
      "Account audit & rebuild",
      "Pixel / CAPI verification",
      "2 creative tests per month",
      "Monthly performance report",
      "Email support (48h)",
    ],
    excluded: ["Landing page builds", "Creative production"],
    badge: "",
    is_active: true,
    order: 1,
  },
  {
    price_heading: "Growth",
    price_amount: 850,
    currency: "USD",
    billing_period: "monthly",
    description: "Multi-channel management with full-funnel tracking. The one most clients pick.",
    active_mostpopular: true,
    contact: "https://wa.me/8801700000000",
    cta_label: "Book a strategy call",
    features: [
      "Up to 3 advertising channels",
      "Server-side tracking (CAPI + GTM)",
      "Weekly optimisation cycles",
      "6 creative tests per month",
      "Live Looker Studio dashboard",
      "Landing page conversion review",
      "Weekly written summary",
      "Priority support (12h)",
    ],
    excluded: [],
    badge: "Most popular",
    is_active: true,
    order: 2,
  },
  {
    price_heading: "Scale",
    price_amount: 1600,
    currency: "USD",
    billing_period: "monthly",
    description: "For brands spending $25k+/mo who need a dedicated growth partner.",
    active_mostpopular: false,
    contact: "https://wa.me/8801700000000",
    cta_label: "Request a proposal",
    features: [
      "Unlimited channels",
      "Full measurement architecture",
      "Daily monitoring & pacing",
      "Unlimited creative testing",
      "Creative direction & briefs",
      "Weekly strategy call",
      "CRM & attribution integration",
      "Dedicated Slack channel",
    ],
    excluded: [],
    badge: "",
    is_active: true,
    order: 3,
  },
];

export const DEFAULT_REVIEWS: IReview[] = [
  {
    reviewer_name: "Sarah Mitchell",
    reviewer_role: "Founder",
    company: "Glowline Skincare",
    country: "United States",
    reviewer_image: "https://i.pravatar.cc/160?img=47",
    rating: 5,
    review_text:
      "Nafi found a double-firing pixel that had been inflating our numbers for eight months. Once the data was honest, the optimisation actually worked — we went from break-even to 4.6x ROAS on double the budget.",
    badge_label: "Verified client",
    project_type: "Meta Ads · E-commerce",
    status: "approved",
    featured: true,
    order: 1,
  },
  {
    reviewer_name: "Daniel Okonkwo",
    reviewer_role: "Managing Partner",
    company: "Northbridge Consulting",
    country: "United Kingdom",
    reviewer_image: "https://i.pravatar.cc/160?img=12",
    rating: 5,
    review_text:
      "He talked us out of the campaign we asked for and into one that measured booked calls instead of form fills. Lead volume dropped and revenue went up. That is the whole story.",
    badge_label: "Verified client",
    project_type: "Google Ads · B2B",
    status: "approved",
    featured: true,
    order: 2,
  },
  {
    reviewer_name: "Priya Raman",
    reviewer_role: "Marketing Director",
    company: "Vitalis Health",
    country: "Canada",
    reviewer_image: "https://i.pravatar.cc/160?img=32",
    rating: 5,
    review_text:
      "The weekly summaries are the best I have had from any agency — plain English, no vanity metrics, and always a clear next action. Cost per lead is down 47% since we started.",
    badge_label: "Verified client",
    project_type: "Lead Generation",
    status: "approved",
    featured: false,
    order: 3,
  },
  {
    reviewer_name: "Marcus Feld",
    reviewer_role: "Owner",
    company: "PureAir HVAC",
    country: "Australia",
    reviewer_image: "https://i.pravatar.cc/160?img=68",
    rating: 5,
    review_text:
      "We launched from zero with a small budget. Five months later we are booking around 140 jobs a month and I know exactly what each one costs to acquire.",
    badge_label: "Verified client",
    project_type: "Google Ads · Local",
    status: "approved",
    featured: false,
    order: 4,
  },
  {
    reviewer_name: "Elena Petrova",
    reviewer_role: "Head of Growth",
    company: "Loopwise SaaS",
    country: "Germany",
    reviewer_image: "https://i.pravatar.cc/160?img=45",
    rating: 4,
    review_text:
      "Strong technical setup — the GA4 and CAPI work was the cleanest we have had. Scaling took a little longer than hoped, but the foundation he built is still paying off.",
    badge_label: "Verified client",
    project_type: "Tracking & Analytics",
    status: "approved",
    featured: false,
    order: 5,
  },
];

export const DEFAULT_PORTFOLIO: IPortfolio[] = [
  {
    title: "Glowline — DTC skincare scale-up",
    category: "Meta Ads",
    result_label: "4.6x ROAS on 2x budget",
    metric_value: "4.6x",
    metric_label: "Blended ROAS",
    cover_image:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=80",
    description:
      "Account rebuild, server-side tracking and a structured creative testing plan.",
    client_name: "Glowline",
    tags: ["E-commerce", "CAPI", "Creative testing"],
    featured: true,
    is_active: true,
    order: 1,
  },
  {
    title: "Northbridge — qualified B2B pipeline",
    category: "Lead Gen",
    result_label: "−61% cost per qualified lead",
    metric_value: "−61%",
    metric_label: "Cost per lead",
    cover_image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1000&q=80",
    description: "Re-pointed optimisation from form fills to booked calls.",
    client_name: "Northbridge Consulting",
    tags: ["B2B", "Google Ads", "GA4"],
    featured: true,
    is_active: true,
    order: 2,
  },
  {
    title: "PureAir — local service launch",
    category: "Google Ads",
    result_label: "140 booked jobs / month",
    metric_value: "140",
    metric_label: "Jobs per month",
    cover_image:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1000&q=80",
    description: "Zero-to-one launch with call tracking and seasonal pacing.",
    client_name: "PureAir HVAC",
    tags: ["Local", "Call tracking", "PMax"],
    featured: false,
    is_active: true,
    order: 3,
  },
  {
    title: "Loopwise — SaaS trial acquisition",
    category: "Analytics",
    result_label: "95% event match quality",
    metric_value: "95%",
    metric_label: "Match quality",
    cover_image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80",
    description: "Server-side GTM, GA4 funnel mapping and deduplicated events.",
    client_name: "Loopwise",
    tags: ["SaaS", "GTM", "GA4"],
    featured: false,
    is_active: true,
    order: 4,
  },
  {
    title: "Verde — TikTok creative sprint",
    category: "TikTok Ads",
    result_label: "3.2x view-through lift",
    metric_value: "3.2x",
    metric_label: "View-through lift",
    cover_image:
      "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=1000&q=80",
    description: "Hook-first short-form testing across 18 creative variants.",
    client_name: "Verde",
    tags: ["Short-form", "UGC", "Testing"],
    featured: false,
    is_active: true,
    order: 5,
  },
  {
    title: "Kindred — YouTube demand capture",
    category: "YouTube Ads",
    result_label: "−38% cost per acquisition",
    metric_value: "−38%",
    metric_label: "CPA",
    cover_image:
      "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=1000&q=80",
    description: "In-stream and Shorts placements with view-through attribution.",
    client_name: "Kindred",
    tags: ["Video", "Attribution"],
    featured: false,
    is_active: true,
    order: 6,
  },
];
