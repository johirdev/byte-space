import {
  DEFAULT_COURSE_INCLUDES,
  type CourseLevel,
  type ICourseModule,
} from "../types";

/**
 * Category-aware course drafting used by the admin "AI auto-fill" button.
 *
 * It is a deterministic template engine: the category (and optional title)
 * pick a topic blueprint, and a seeded RNG varies titles and lesson lengths so
 * two courses in the same category don't come out identical. To move to a real
 * LLM later, replace `generateCourseDraft` — the route and the form only rely
 * on the returned `CourseDraft` shape.
 */

type ModuleBlueprint = [title: string, description: string, lessons: string[]];

type Topic = {
  match: RegExp;
  titles: string[];
  subtitles: string[];
  audience: string;
  outcome: string;
  modules: ModuleBlueprint[];
  tags: string[];
  price: [min: number, max: number];
  creatorTitle: string;
};

export type CourseDraft = {
  title: string;
  subtitle: string;
  level: CourseLevel;
  price: number;
  price_label: string;
  description: string;
  key_points: string[];
  includes: string[];
  modules_intro: string;
  lesson_content_info: string;
  progress_info: string;
  modules: ICourseModule[];
  tags: string[];
  creator: { name: string; title: string; bio: string };
};

const TOPICS: Topic[] = [
  {
    match: /\bui\b|\bux\b|ui\/ux|figma|product design|web design|interface/i,
    titles: [
      "Learn Figma from Basic",
      "UI/UX Design Masterclass: From Wireframe to Prototype",
      "Designing Delightful Interfaces",
    ],
    subtitles: [
      "Design clean, usable interfaces with a professional workflow",
      "Master research, wireframes, visual design and prototyping",
    ],
    audience: "aspiring product designers, developers and founders",
    outcome: "ship polished, user-centred interfaces with confidence",
    modules: [
      ["Foundations of UI/UX", "Understand how users think and what makes an interface usable.", ["What UX really means", "The UI design vocabulary", "Setting up your Figma workspace"]],
      ["User Research & Personas", "Turn interviews and data into clear design decisions.", ["Planning user interviews", "Building personas", "Mapping the user journey"]],
      ["Wireframing & Information Architecture", "Structure content before you style it.", ["Low-fidelity wireframes", "Navigation patterns", "Card sorting in practice"]],
      ["Visual Design Principles", "Colour, typography, spacing and hierarchy that feel right.", ["Colour theory for screens", "Typography essentials", "Grids and spacing systems"]],
      ["Components & Design Systems", "Build reusable components that scale across a product.", ["Auto layout deep dive", "Variants and component props", "Documenting a design system"]],
      ["Prototyping & Interaction", "Bring flows to life and test them with real users.", ["Interactive prototypes", "Micro-interactions", "Running a usability test"]],
      ["Portfolio Case Study", "Package your work into a case study that gets you hired.", ["Choosing the right project", "Writing the case study", "Presenting to stakeholders"]],
    ],
    tags: ["figma", "ui design", "ux research", "prototyping"],
    price: [19, 49],
    creatorTitle: "Senior Product Designer",
  },
  {
    match: /music|guitar|piano|audio|song|beat|producer|vocal/i,
    titles: [
      "Music Production Essentials",
      "From Idea to Track: Modern Music Production",
      "Songwriting & Home Recording Bootcamp",
    ],
    subtitles: [
      "Write, record and mix songs that sound professional",
      "Turn musical ideas into finished, release-ready tracks",
    ],
    audience: "beginner producers, songwriters and bedroom musicians",
    outcome: "produce, arrange and mix complete tracks at home",
    modules: [
      ["Music Theory Refresher", "The theory you actually need to write great music.", ["Scales and keys", "Chords and progressions", "Rhythm and groove"]],
      ["Setting Up Your Studio", "Get the most out of a simple home setup.", ["Choosing a DAW", "Microphones and interfaces", "Treating your room"]],
      ["Songwriting Workshop", "Structure songs that hold attention.", ["Hooks and melodies", "Song structure", "Writing lyrics that land"]],
      ["Recording Techniques", "Capture clean takes of vocals and instruments.", ["Gain staging", "Recording vocals", "Comping and editing takes"]],
      ["Sound Design & Arrangement", "Build energy and interest across the track.", ["Synth basics", "Drum programming", "Arranging for impact"]],
      ["Mixing Fundamentals", "Balance, EQ and compression without the guesswork.", ["Levels and panning", "EQ and compression", "Reverb and delay"]],
      ["Mastering & Release", "Finish your track and get it heard.", ["Mastering basics", "Loudness and formats", "Distributing your music"]],
    ],
    tags: ["music production", "mixing", "songwriting", "daw"],
    price: [15, 45],
    creatorTitle: "Music Producer & Engineer",
  },
  {
    match: /draw|paint|illustrat|sketch|\bart\b|watercolou?r/i,
    titles: [
      "Drawing & Painting for Beginners",
      "Digital Illustration: From Sketch to Finished Piece",
      "Watercolour Fundamentals",
    ],
    subtitles: [
      "Build real drawing skills one technique at a time",
      "Learn composition, colour and light to create expressive art",
    ],
    audience: "hobbyists and aspiring illustrators",
    outcome: "create finished artworks with confident technique",
    modules: [
      ["Tools & Materials", "Pick the right tools and set up your practice.", ["Pencils, brushes and paper", "Digital vs traditional", "Building a daily habit"]],
      ["Lines, Shapes & Form", "See the world as simple shapes.", ["Confident line work", "Basic shapes to 3D form", "Perspective essentials"]],
      ["Light & Shadow", "Make drawings feel solid and real.", ["Value scales", "Cast and form shadows", "Rendering textures"]],
      ["Colour Theory", "Mix and choose colours with intention.", ["The colour wheel", "Warm and cool palettes", "Colour harmony"]],
      ["Composition", "Guide the viewer's eye through your piece.", ["Rule of thirds and beyond", "Focal points", "Thumbnail sketching"]],
      ["Painting Techniques", "Layer, blend and finish like a pro.", ["Blocking in", "Blending and glazing", "Adding final details"]],
      ["Your Portfolio Piece", "Plan and complete a showcase artwork.", ["Choosing a subject", "Step-by-step painting", "Photographing your art"]],
    ],
    tags: ["drawing", "painting", "illustration", "art"],
    price: [12, 39],
    creatorTitle: "Illustrator & Art Educator",
  },
  {
    match: /social media|instagram|tiktok|youtube|content creat/i,
    titles: [
      "Social Media Growth Blueprint",
      "Content Creation for Social Media",
      "Grow an Audience on Instagram & TikTok",
    ],
    subtitles: [
      "Create content people share and build a loyal audience",
      "A repeatable system for growing on every platform",
    ],
    audience: "creators, freelancers and small business owners",
    outcome: "plan, create and grow a consistent social presence",
    modules: [
      ["Platform Fundamentals", "How each platform's algorithm rewards content.", ["Choosing your platforms", "How algorithms rank content", "Defining your niche"]],
      ["Content Strategy", "Plan content that serves your goals.", ["Content pillars", "Building a content calendar", "Batching your week"]],
      ["Short-form Video", "Hook, hold and convert viewers.", ["Writing hooks", "Filming on your phone", "Editing for retention"]],
      ["Design for Social", "Eye-catching visuals without a design degree.", ["Carousel design", "Brand templates", "Thumbnails that get clicks"]],
      ["Community & Engagement", "Turn followers into fans.", ["Replying with intent", "Collaborations", "Running live sessions"]],
      ["Analytics & Growth", "Measure what matters and iterate.", ["Reading your insights", "A/B testing content", "Scaling what works"]],
      ["Monetisation", "Turn attention into income.", ["Brand deals", "Digital products", "Affiliate strategies"]],
    ],
    tags: ["social media", "content", "instagram", "tiktok"],
    price: [15, 35],
    creatorTitle: "Content Strategist",
  },
  {
    match: /market|brand|seo|advertis|growth/i,
    titles: [
      "Digital Marketing Fundamentals",
      "Creative Marketing Strategies That Convert",
      "Brand Building & Growth Marketing",
    ],
    subtitles: [
      "Plan campaigns that reach the right people and convert",
      "Master strategy, content, ads and analytics",
    ],
    audience: "marketers, founders and freelancers",
    outcome: "plan and run marketing campaigns that drive growth",
    modules: [
      ["Marketing Foundations", "Positioning, audiences and the funnel.", ["Understanding your customer", "Positioning and messaging", "The marketing funnel"]],
      ["Brand Strategy", "Build a brand people remember.", ["Brand identity", "Voice and tone", "Storytelling for brands"]],
      ["Content Marketing", "Attract customers with valuable content.", ["Content that ranks", "Email newsletters", "Repurposing content"]],
      ["SEO Essentials", "Get found on search engines.", ["Keyword research", "On-page SEO", "Link building basics"]],
      ["Paid Advertising", "Spend smart on ads that perform.", ["Meta ads setup", "Google Ads basics", "Creative testing"]],
      ["Analytics & Optimisation", "Measure, learn and improve.", ["Setting up analytics", "Conversion tracking", "Optimising campaigns"]],
      ["Campaign Capstone", "Plan a full campaign from brief to report.", ["Writing the brief", "Launching the campaign", "Reporting results"]],
    ],
    tags: ["marketing", "branding", "seo", "ads"],
    price: [19, 49],
    creatorTitle: "Growth Marketing Lead",
  },
  {
    match: /anim|motion|3d|blender|after effects/i,
    titles: [
      "Animation Fundamentals",
      "Motion Design with After Effects",
      "2D Character Animation",
    ],
    subtitles: [
      "Bring characters and ideas to life with movement",
      "Learn the principles every animator relies on",
    ],
    audience: "aspiring animators and motion designers",
    outcome: "animate expressive, polished motion pieces",
    modules: [
      ["The 12 Principles of Animation", "The timeless rules behind believable motion.", ["Squash and stretch", "Anticipation and follow-through", "Timing and spacing"]],
      ["Tools & Workflow", "Set up an efficient animation pipeline.", ["Choosing your software", "Keyframes and the graph editor", "Organising projects"]],
      ["Character Animation", "Give characters weight and personality.", ["Walk cycles", "Acting and expression", "Lip sync basics"]],
      ["Motion Graphics", "Animate type, shapes and UI.", ["Kinetic typography", "Shape layers", "Animating interfaces"]],
      ["Effects & Compositing", "Polish shots with effects.", ["Particles and simulations", "Colour grading", "Compositing layers"]],
      ["Sound & Storytelling", "Sync motion with sound and narrative.", ["Storyboarding", "Animatics", "Sound design for animation"]],
      ["Showreel Project", "Build a short piece for your reel.", ["Planning the piece", "Production", "Rendering and export"]],
    ],
    tags: ["animation", "motion design", "after effects"],
    price: [19, 45],
    creatorTitle: "Animator & Motion Designer",
  },
  {
    match: /cook|food|bak|kitchen|chef|recipe/i,
    titles: [
      "Home Cooking Masterclass",
      "Cooking Essentials: From Knife Skills to Plating",
      "The Art of Baking",
    ],
    subtitles: [
      "Cook confident, delicious meals every day",
      "Professional techniques for the home kitchen",
    ],
    audience: "home cooks of every level",
    outcome: "cook balanced, restaurant-quality meals at home",
    modules: [
      ["Kitchen Fundamentals", "Set up and stay safe.", ["Essential equipment", "Knife skills", "Food safety"]],
      ["Flavour Building", "Season with confidence.", ["Salt, fat, acid, heat", "Herbs and spices", "Making stocks"]],
      ["Cooking Techniques", "Methods that unlock every recipe.", ["Sautéing and searing", "Roasting and braising", "Steaming and poaching"]],
      ["Sauces & Dressings", "The secret to memorable dishes.", ["Mother sauces", "Emulsions", "Quick pan sauces"]],
      ["Baking Basics", "Breads and desserts that work every time.", ["Understanding dough", "Cakes and pastries", "Troubleshooting bakes"]],
      ["Meal Planning", "Cook efficiently all week.", ["Batch cooking", "Balanced menus", "Smart grocery shopping"]],
      ["Plating & Hosting", "Serve food that looks as good as it tastes.", ["Plating principles", "Menu for a dinner party", "Timing a multi-course meal"]],
    ],
    tags: ["cooking", "baking", "recipes"],
    price: [12, 35],
    creatorTitle: "Professional Chef",
  },
  {
    match: /develop|program|code|coding|web|javascript|react|python|software/i,
    titles: [
      "Modern Web Development Bootcamp",
      "JavaScript from Zero to Hero",
      "Build Full-Stack Apps with React & Node",
    ],
    subtitles: [
      "Build real projects and learn the skills employers want",
      "From fundamentals to deploying production apps",
    ],
    audience: "beginners and career-switchers into software",
    outcome: "build and deploy full-stack web applications",
    modules: [
      ["Programming Fundamentals", "Think like a developer.", ["Variables and types", "Control flow", "Functions and scope"]],
      ["The Web Platform", "HTML, CSS and how browsers work.", ["Semantic HTML", "Modern CSS layout", "Responsive design"]],
      ["JavaScript in Depth", "The language of the web.", ["Objects and arrays", "Async and promises", "Working with APIs"]],
      ["Frontend Frameworks", "Build interfaces with components.", ["Components and props", "State and effects", "Routing"]],
      ["Backend & Databases", "Store data and build APIs.", ["REST API design", "Databases and models", "Authentication"]],
      ["Testing & Quality", "Ship with confidence.", ["Unit testing", "Debugging techniques", "Code review practices"]],
      ["Deploy Your Project", "Launch a real app to the world.", ["Environment config", "Deployment", "Monitoring and iteration"]],
    ],
    tags: ["web development", "javascript", "react", "node"],
    price: [25, 59],
    creatorTitle: "Senior Software Engineer",
  },
  {
    match: /photo|camera|lightroom/i,
    titles: ["Photography Masterclass", "Mobile Photography Essentials", "Portrait Photography"],
    subtitles: ["Take stunning photos with any camera", "Master light, composition and editing"],
    audience: "hobbyist and aspiring photographers",
    outcome: "shoot and edit photos with a professional eye",
    modules: [
      ["Camera Basics", "Understand your camera.", ["Exposure triangle", "Shooting modes", "Lenses explained"]],
      ["Composition", "Frame compelling images.", ["Rule of thirds", "Leading lines", "Framing and depth"]],
      ["Working with Light", "Light is everything.", ["Natural light", "Golden hour", "Artificial lighting"]],
      ["Genres", "Portraits, landscape and street.", ["Portraits", "Landscapes", "Street photography"]],
      ["Editing Workflow", "Develop your images.", ["Lightroom basics", "Colour grading", "Retouching"]],
      ["Building a Style", "Find your photographic voice.", ["Studying the masters", "Creating a series", "Consistency"]],
      ["Going Pro", "Turn photos into income.", ["Building a portfolio", "Pricing your work", "Finding clients"]],
    ],
    tags: ["photography", "lightroom", "editing"],
    price: [15, 45],
    creatorTitle: "Professional Photographer",
  },
  {
    match: /business|startup|entrepreneur|productiv|management|leader/i,
    titles: [
      "From Idea to Startup Success",
      "Balancing Productivity and Wellbeing",
      "Business Fundamentals for Founders",
    ],
    subtitles: ["Validate, launch and grow a business", "Practical frameworks from real founders"],
    audience: "founders, freelancers and future leaders",
    outcome: "validate ideas and build a sustainable business",
    modules: [
      ["Finding the Idea", "Spot problems worth solving.", ["Idea generation", "Market research", "Choosing your niche"]],
      ["Validation", "Test before you build.", ["Customer interviews", "Landing page tests", "Pre-selling"]],
      ["Business Model", "Make the numbers work.", ["Revenue models", "Pricing strategy", "Unit economics"]],
      ["Building the MVP", "Launch lean and learn fast.", ["Scoping an MVP", "No-code tools", "Launch checklist"]],
      ["Sales & Growth", "Find your first customers.", ["Sales fundamentals", "Growth channels", "Partnerships"]],
      ["Operations & Productivity", "Run the business without burning out.", ["Systems and automation", "Time management", "Hiring your first team"]],
      ["Funding & Scaling", "Plan the next stage.", ["Bootstrapping vs funding", "Pitching investors", "Scaling sustainably"]],
    ],
    tags: ["business", "startup", "productivity"],
    price: [19, 49],
    creatorTitle: "Founder & Business Coach",
  },
  {
    match: /financ|money|invest|account|crypto|trading/i,
    titles: ["Mastering Money Management", "Personal Finance Essentials", "Investing for Beginners"],
    subtitles: ["Take control of your money and build wealth", "Budget, save and invest with confidence"],
    audience: "anyone who wants to feel confident with money",
    outcome: "budget, save and invest with a clear plan",
    modules: [
      ["Money Mindset", "Build healthy financial habits.", ["Your money story", "Setting financial goals", "Tracking your spending"]],
      ["Budgeting", "Give every dollar a job.", ["Budgeting methods", "Building a budget", "Automating savings"]],
      ["Debt & Credit", "Get out and stay out of debt.", ["Understanding credit", "Debt payoff strategies", "Avoiding traps"]],
      ["Saving & Emergency Funds", "Build your safety net.", ["Emergency funds", "High-yield savings", "Sinking funds"]],
      ["Investing Basics", "Grow wealth over time.", ["Stocks and bonds", "Index funds", "Risk and diversification"]],
      ["Retirement Planning", "Plan for the long term.", ["Retirement accounts", "Compound growth", "How much is enough"]],
      ["Your Financial Plan", "Put it all together.", ["Building your plan", "Reviewing progress", "Staying on track"]],
    ],
    tags: ["finance", "budgeting", "investing"],
    price: [15, 39],
    creatorTitle: "Certified Financial Planner",
  },
  {
    match: /data|analytics|machine learning|\bai\b|statistic/i,
    titles: ["The Power of Big Data", "Data Analytics for Beginners", "Practical Machine Learning"],
    subtitles: ["Turn raw data into decisions", "Analyse, visualise and model real datasets"],
    audience: "analysts, developers and curious professionals",
    outcome: "analyse data and communicate insights clearly",
    modules: [
      ["Data Foundations", "Understand data and where it comes from.", ["Types of data", "Data collection", "Data ethics"]],
      ["Spreadsheets & SQL", "Query and clean data.", ["Spreadsheet power tools", "SQL basics", "Joins and aggregations"]],
      ["Data Cleaning", "Make messy data usable.", ["Handling missing values", "Outliers", "Reshaping data"]],
      ["Visualisation", "Tell stories with charts.", ["Choosing the right chart", "Dashboards", "Design for clarity"]],
      ["Statistics", "Draw reliable conclusions.", ["Descriptive statistics", "Hypothesis testing", "Correlation vs causation"]],
      ["Intro to Machine Learning", "Predict with data.", ["Regression", "Classification", "Evaluating models"]],
      ["Capstone Analysis", "Analyse a real dataset end to end.", ["Framing the question", "Analysis", "Presenting insights"]],
    ],
    tags: ["data", "analytics", "sql", "machine learning"],
    price: [25, 55],
    creatorTitle: "Lead Data Scientist",
  },
];

/** Tiny seeded PRNG so the same title yields the same draft. */
const seeded = (seedText: string) => {
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const genericTopic = (category: string): Topic => {
  const c = category.trim() || "this subject";
  return {
    match: /.*/,
    titles: [`${c} Masterclass`, `${c}: A Complete Guide`, `The Essentials of ${c}`],
    subtitles: [
      `Build real ${c.toLowerCase()} skills with hands-on projects`,
      `Everything you need to go from beginner to confident in ${c.toLowerCase()}`,
    ],
    audience: `beginners and professionals interested in ${c.toLowerCase()}`,
    outcome: `apply ${c.toLowerCase()} skills to real projects`,
    modules: [
      [`Introduction to ${c}`, `Core ideas and vocabulary of ${c.toLowerCase()}.`, ["Welcome and course overview", "Key concepts", "Setting up your tools"]],
      ["Foundational Concepts", "The building blocks you'll use in every project.", ["Fundamentals part 1", "Fundamentals part 2", "Common mistakes to avoid"]],
      ["Core Techniques", "The techniques professionals rely on daily.", ["Technique walkthrough", "Guided practice", "Techniques in context"]],
      ["Intermediate Skills", "Level up with more advanced workflows.", ["Efficient workflows", "Problem solving", "Quality and consistency"]],
      ["Advanced Techniques", "Push your skills further.", ["Advanced methods", "Case studies", "Expert tips"]],
      ["Real-World Application", "Apply what you've learnt to realistic scenarios.", ["Planning a project", "Execution", "Feedback and iteration"]],
      ["Capstone Project", "Bring it all together in a portfolio-ready project.", ["Project brief", "Building the project", "Presenting your work"]],
    ],
    tags: [c.toLowerCase()],
    price: [15, 45],
    creatorTitle: `${c} Instructor`,
  };
};

const pick = <T>(rand: () => number, list: T[]): T => list[Math.floor(rand() * list.length)];

export function generateCourseDraft(input: {
  category: string;
  title?: string;
  level?: CourseLevel;
  creatorName?: string;
}): CourseDraft {
  const haystack = `${input.category} ${input.title ?? ""}`;
  const topic = TOPICS.find((t) => t.match.test(haystack)) ?? genericTopic(input.category);
  const rand = seeded(`${input.category}|${input.title ?? ""}|${Date.now() >> 16}`);

  const title = input.title?.trim() || pick(rand, topic.titles);
  const subtitle = pick(rand, topic.subtitles);
  const level =
    input.level ?? pick<CourseLevel>(rand, ["Beginner", "Beginner", "Intermediate", "Advanced"]);
  const [min, max] = topic.price;
  const price = Math.round(min + rand() * (max - min));
  const creatorName = input.creatorName?.trim() || "PurePearl Studio";

  const modules: ICourseModule[] = topic.modules.map(([mTitle, mDesc, lessons], i) => ({
    title: `Module ${i + 1}: ${mTitle}`,
    description: `${mDesc} Lessons include ${lessons
      .slice(0, 2)
      .map((l) => `'${l}'`)
      .join(" and ")}.`,
    lessons: lessons.map((lesson, j) => ({
      title: lesson,
      duration: 6 + Math.round(rand() * 22),
      is_preview: i === 0 && j === 0,
    })),
  }));

  const keyPoints = [
    ...topic.modules.slice(0, 7).map(([mTitle]) => mTitle),
    `Capstone Project: ${topic.modules[topic.modules.length - 1][0]}`,
  ];

  const description = [
    `Embark on a practical journey into ${input.category.toLowerCase()} with "${title}". This course is designed for ${topic.audience}, and walks you step by step from the essentials to professional-level techniques, so you can ${topic.outcome}.`,
    `In the opening modules you'll build a solid foundation — ${topic.modules
      .slice(0, 2)
      .map(([m]) => m.toLowerCase())
      .join(" and ")} — so every later lesson has something to stand on. Each concept is explained with clear examples and short exercises you can finish in a single sitting.`,
    `As you progress, you'll move into ${topic.modules
      .slice(3, 6)
      .map(([m]) => m.toLowerCase())
      .join(", ")}. Hands-on projects reinforce every module, and the final capstone gives you a portfolio-ready piece that shows exactly what you can do.`,
  ].join("\n\n");

  return {
    title,
    subtitle,
    level,
    price,
    price_label: "lifetime",
    description,
    key_points: keyPoints,
    includes: [...DEFAULT_COURSE_INCLUDES],
    modules_intro:
      "Immerse yourself in the course content as we break down each module into comprehensive lessons, providing practical insights and hands-on experiences.",
    lesson_content_info:
      "Engage with each lesson through captivating video content, detailed textual explanations, and interactive elements. Download resources, complete assignments, and test your understanding with quizzes.",
    progress_info:
      "Witness your growth as you complete lessons, with an intuitive progress tracking feature guiding you through your learning journey.",
    modules,
    tags: topic.tags,
    creator: {
      name: creatorName,
      title: topic.creatorTitle,
      bio: "Ready to Dive In? Enroll Now and Start Building Your Future!",
    },
  };
}
