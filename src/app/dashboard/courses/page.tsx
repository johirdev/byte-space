import CourseList from "@/Components/Dashboard/Courses/CourseList";

export default async function CoursesPage({ searchParams }: PageProps<"/dashboard/courses">) {
  const { category } = await searchParams;
  return <CourseList initialCategory={typeof category === "string" ? category : ""} />;
}
