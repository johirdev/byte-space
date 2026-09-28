import type { Metadata } from "next";
import CourseDetails from "@/Components/Frontend/Pages/CourseDetails/CourseDetails";
import { connectDB } from "@/app/lib/db";
import { getCourse } from "@/app/services/course.service";

// Metadata reads the service directly (no HTTP hop); the page body loads
// through the public API so it stays in sync with the dashboard.
export async function generateMetadata({ params }: PageProps<"/courses/[id]">): Promise<Metadata> {
  const { id } = await params;
  try {
    await connectDB();
    const course = await getCourse(id);
    return {
      title: `${course.title} | ByteSpace`,
      description: course.subtitle || course.description.slice(0, 155),
      openGraph: {
        title: course.title,
        description: course.subtitle,
        images: course.thumbnail ? [course.thumbnail] : undefined,
      },
    };
  } catch {
    return { title: "Course | ByteSpace" };
  }
}

const CourseDetailsPage = async ({ params }: PageProps<"/courses/[id]">) => {
  const { id } = await params;
  return <CourseDetails slug={id} />;
};

export default CourseDetailsPage;
