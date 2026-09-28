import { CourseCategoryModel } from "../models/courseCategory.model";
import { CourseModel } from "../models/course.model";
import { CourseReviewModel } from "../models/courseReview.model";
import { DEFAULT_COURSE_INCLUDES, type CourseLevel } from "../types";
import { ApiError } from "../lib/apiError";
import { slugify } from "../lib/validate";
import { generateCourseDraft } from "./courseAutofill.service";
import { recomputeCourseRating } from "./course.service";

/**
 * Demo content so the public pages and the dashboard have something to show
 * on a fresh database. Images come from picsum/pravatar placeholders — swap
 * them for imgbb uploads from the dashboard.
 */

const CATEGORIES = [
  "Music",
  "Drawing & Painting",
  "Marketing",
  "Animation",
  "Social Media",
  "UI/UX Design",
  "Creative Marketing",
  "Cooking",
  "Development",
  "Business",
  "Finance",
  "Data Science",
];

const img = (seed: string, w = 800, h = 500) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
const avatar = (n: number) => `https://i.pravatar.cc/120?img=${n}`;

const DEMO_COURSES: { title: string; category: string; level: CourseLevel; featured?: boolean }[] = [
  { title: "Learn Figma from Basic", category: "UI/UX Design", level: "Beginner", featured: true },
  { title: "The Power of Big Data", category: "Data Science", level: "Beginner", featured: true },
  { title: "Balancing Productivity and Wellbeing", category: "Business", level: "Beginner" },
  { title: "Mastering Money Management", category: "Finance", level: "Beginner", featured: true },
  { title: "From Idea to Startup Success", category: "Business", level: "Intermediate" },
  { title: "Music Production Essentials", category: "Music", level: "Beginner" },
  { title: "Songwriting & Home Recording Bootcamp", category: "Music", level: "Intermediate" },
  { title: "Drawing & Painting for Beginners", category: "Drawing & Painting", level: "Beginner", featured: true },
  { title: "Digital Illustration: From Sketch to Finished Piece", category: "Drawing & Painting", level: "Intermediate" },
  { title: "Digital Marketing Fundamentals", category: "Marketing", level: "Beginner" },
  { title: "Animation Fundamentals", category: "Animation", level: "Beginner" },
  { title: "Motion Design with After Effects", category: "Animation", level: "Advanced" },
  { title: "Social Media Growth Blueprint", category: "Social Media", level: "Beginner", featured: true },
  { title: "Creative Marketing Strategies That Convert", category: "Creative Marketing", level: "Intermediate" },
  { title: "Home Cooking Masterclass", category: "Cooking", level: "Beginner" },
  { title: "Modern Web Development Bootcamp", category: "Development", level: "Intermediate" },
  { title: "UI/UX Design Masterclass: From Wireframe to Prototype", category: "UI/UX Design", level: "Advanced" },
];

const REVIEWERS = [
  { name: "PurePearl Studio", designation: "UI/UX Designer", avatar: avatar(12) },
  { name: "Albert Flores", designation: "UI/UX Designer", avatar: avatar(33) },
  { name: "Cody Fisher", designation: "UI/UX Designer", avatar: avatar(59) },
  { name: "Brooklyn Simmons", designation: "UI/UX Designer", avatar: avatar(47) },
  { name: "Jenny Wilson", designation: "Product Manager", avatar: avatar(45) },
  { name: "Wade Warren", designation: "Frontend Developer", avatar: avatar(15) },
  { name: "Esther Howard", designation: "Marketing Lead", avatar: avatar(44) },
  { name: "Cameron Williamson", designation: "Freelancer", avatar: avatar(53) },
];

const COMMENTS = [
  "The course provided me with a comprehensive understanding of the subject. The lessons were in-depth, practical, and immediately applicable to my work. Highly recommended!",
  "This course transformed my approach. The combination of theory, hands-on exercises, and real-world applications made it a truly enriching experience. Excited to implement what I've learned!",
  "The project showcase and critique module created a collaborative environment where I could showcase my work, receive valuable feedback, and refine my skills.",
  "The lessons were particularly insightful. The course adapts to the evolving landscape, and the engaging content kept me motivated throughout.",
  "Clear explanations and well-paced videos. I finished the capstone with a piece I'm proud to put in my portfolio.",
  "Good content overall, a few lessons could be longer but the resources made up for it.",
];

/** The "Build Digital Asset" course, mirroring the Figma design copy. */
const buildDigitalAsset = (categoryId: unknown) => ({
  title: "Build Digital Asset: A Comprehensive Guide",
  slug: "build-digital-asset-a-comprehensive-guide",
  subtitle: "Unlock the Power of Digital Creation with Expert Guidance",
  category: categoryId,
  level: "Intermediate" as CourseLevel,
  price: 25,
  price_label: "lifetime",
  thumbnail: img("digital-asset"),
  preview_video: "https://www.youtube.com/watch?v=c9Wg6Cb_YlU",
  description: [
    `Embark on an enlightening exploration into the world of digital creation with our comprehensive course, "Build Digital Assets: A Comprehensive Guide." This transformative learning experience invites you to delve deep into the intricacies of crafting impactful digital content. From laying the groundwork with foundational concepts to mastering advanced techniques, this guide is meticulously curated to empower you with the skills essential for navigating the dynamic landscape of digital asset creation.`,
    `In the initial modules, you'll establish a solid foundation by immersing yourself in the foundational concepts that form the backbone of digital asset creation. Understand the fundamental elements that constitute compelling digital content and gain proficiency in leveraging these elements to communicate effectively in the digital realm.`,
    `As you progress through the course, you'll ascend to higher levels of expertise, delving into the nuances of design principles that drive impactful creations. Uncover the secrets behind effective visual communication, exploring color theory, typography, and layout strategies that elevate your digital assets to new heights. Engage in hands-on exercises that reinforce your understanding, allowing you to apply these principles in practical scenarios.`,
  ].join("\n\n"),
  sneak_peek: [img("peek-1", 400, 300), img("peek-2", 400, 300), img("peek-3", 400, 300), img("peek-4", 400, 300)],
  key_points: [
    "Foundational Concepts",
    "Design Principles Mastery",
    "Advanced Techniques in Digital Creation",
    "Project Showcase and Critique",
    "Optimizing for Various Platforms",
    "Digital Asset Management Best Practices",
    "Monetization Strategies",
    "Capstone Project: Building Your Portfolio",
  ],
  includes: [...DEFAULT_COURSE_INCLUDES],
  modules_intro:
    "Immerse yourself in the course content as we break down each module into comprehensive lessons, providing practical insights and hands-on experiences.",
  lesson_content_info:
    "Engage with each lesson through captivating video content, detailed textual explanations, and interactive elements. Download resources, complete assignments, and test your understanding with quizzes.",
  progress_info:
    "Witness your growth as you complete lessons, with an intuitive progress tracking feature guiding you through your learning journey.",
  modules: [
    {
      title: "Module 1: Introduction to Digital Assets",
      description: "Lay the groundwork with lessons like 'Understanding Digital Elements' and 'Navigating Design Software Tools.' Dive into the essentials of digital asset creation.",
      lessons: [
        { title: "Introduction to Digital Assets", duration: 12, is_preview: true },
        { title: "Understanding Digital Elements", duration: 18 },
        { title: "Navigating Design Software Tools", duration: 22 },
      ],
    },
    {
      title: "Module 2: Design Principles for Impact",
      description: "Master the principles that drive impactful designs with lessons such as 'Color Theory in Digital Design' and 'Typography Essentials.' Elevate your visual communication skills.",
      lessons: [
        { title: "Design Principles for Impacts", duration: 21 },
        { title: "Color Theory in Digital Design", duration: 19 },
        { title: "Typography Essentials", duration: 17 },
      ],
    },
    {
      title: "Module 3: Advanced Techniques in Digital Creation",
      description: "Go beyond the basics with advanced layering, compositing and asset optimisation techniques.",
      lessons: [
        { title: "Advanced Techniques in Digital Creation", duration: 16 },
        { title: "Layering and Compositing", duration: 24 },
      ],
    },
    {
      title: "Module 4: User-Centric Design Strategies",
      description: "Understand 'Design Thinking in Digital Creation' and delve into 'User Experience (UX) Essentials.' Craft digital assets with a focus on user-centric design.",
      lessons: [
        { title: "Design Thinking in Digital Creation", duration: 20 },
        { title: "User Experience (UX) Essentials", duration: 23 },
      ],
    },
    {
      title: "Module 5: Interactive Media and Engagement",
      description: "Engage your audience with lessons like 'Creating Interactive Presentations' and 'Integrating Multimedia Elements.' Master the art of creating immersive digital experiences.",
      lessons: [
        { title: "Creating Interactive Presentations", duration: 18 },
        { title: "Integrating Multimedia Elements", duration: 21 },
      ],
    },
    {
      title: "Module 6: Project Showcase and Critique",
      description: "Perfect your presentation skills with 'Effective Presentation Techniques' and embrace collaboration with 'Peer Critique and Collaboration.' Showcase your work with confidence.",
      lessons: [
        { title: "Effective Presentation Techniques", duration: 15 },
        { title: "Peer Critique and Collaboration", duration: 26 },
      ],
    },
    {
      title: "Module 7: Optimizing Digital Assets for Various Platforms",
      description: "Adapt your digital creations for 'Mobile Platforms' and optimize for 'Social Media.' Ensure widespread accessibility and engagement across diverse digital landscapes.",
      lessons: [
        { title: "Optimizing for Mobile Platforms", duration: 19 },
        { title: "Optimizing for Social Media", duration: 17 },
      ],
    },
  ],
  creator: {
    name: "PurePearl Studio",
    title: "Professional Creator",
    avatar: avatar(12),
    bio: "Ready to Dive In? Enroll Now and Start Building Your Digital Future!",
  },
  students_count: 199,
  tags: ["digital assets", "design", "branding"],
  is_featured: true,
  status: "published",
});

export async function seedCourseDemo(): Promise<{
  categories: number;
  courses: number;
  reviews: number;
}> {
  if ((await CourseModel.estimatedDocumentCount()) > 0) {
    throw new ApiError(409, "Courses already exist — demo data is only loaded into an empty catalogue.");
  }

  // Categories: create any that are missing, keep the ones the admin made.
  const categoryIds = new Map<string, unknown>();
  let createdCategories = 0;
  for (const [order, name] of CATEGORIES.entries()) {
    const slug = slugify(name);
    let category = await CourseCategoryModel.findOne({ slug }).lean();
    if (!category) {
      category = (await CourseCategoryModel.create({ name, slug, order, is_active: true })).toObject();
      createdCategories++;
    }
    categoryIds.set(name, category._id);
  }

  const docs: Record<string, unknown>[] = [buildDigitalAsset(categoryIds.get("UI/UX Design"))];

  DEMO_COURSES.forEach((demo, i) => {
    const draft = generateCourseDraft({ category: demo.category, title: demo.title, level: demo.level });
    docs.push({
      ...draft,
      slug: slugify(demo.title),
      category: categoryIds.get(demo.category),
      thumbnail: img(slugify(demo.title)),
      sneak_peek: [1, 2, 3, 4].map((n) => img(`${slugify(demo.title)}-${n}`, 400, 300)),
      preview_video: "",
      creator: { ...draft.creator, avatar: avatar(10 + (i % 50)) },
      students_count: 40 + ((i * 37) % 300),
      is_featured: Boolean(demo.featured),
      status: "published",
    });
  });

  for (const doc of docs) {
    const lessons = (doc.modules as { lessons: { duration: number }[] }[]).flatMap((m) => m.lessons);
    doc.total_lessons = lessons.length;
    doc.total_duration = lessons.reduce((sum, l) => sum + l.duration, 0);
  }

  const courses = await CourseModel.insertMany(docs);

  // A handful of demo reviews per course, mostly 4–5 stars.
  const reviews: Record<string, unknown>[] = [];
  courses.forEach((course, ci) => {
    const count = 4 + (ci % 4);
    for (let r = 0; r < count; r++) {
      const reviewer = REVIEWERS[(ci + r) % REVIEWERS.length];
      reviews.push({
        course: course._id,
        ...reviewer,
        rating: r % 5 === 4 ? 4 : r % 7 === 6 ? 3 : 5,
        comment: COMMENTS[(ci + r) % COMMENTS.length],
        status: "approved",
        createdAt: new Date(Date.now() - (r + 1) * 1000 * 60 * 60 * 24 * (20 + ci)),
      });
    }
  });
  await CourseReviewModel.insertMany(reviews);
  await Promise.all(courses.map((c) => recomputeCourseRating(String(c._id))));

  return { categories: createdCategories, courses: courses.length, reviews: reviews.length };
}
