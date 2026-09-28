import CourseForm from "@/Components/Dashboard/Courses/CourseForm";

export default async function EditCoursePage({ params }: PageProps<"/dashboard/courses/[id]/edit">) {
  const { id } = await params;
  // Keyed so switching between courses resets the form state.
  return <CourseForm key={id} courseId={id} />;
}
