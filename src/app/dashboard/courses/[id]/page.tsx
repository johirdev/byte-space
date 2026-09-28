import CourseView from "@/Components/Dashboard/Courses/CourseView";

export default async function CourseViewPage({ params }: PageProps<"/dashboard/courses/[id]">) {
  const { id } = await params;
  return <CourseView courseId={id} />;
}
