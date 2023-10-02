import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

type CourseIdPageProps = {
  courseId: string;
};

const CourseIdPage = async ({ courseId }: CourseIdPageProps) => {
  const { userId } = auth();

  if (!userId) {
    return redirect("/");
  }

  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
      userId,
    },
    include: {
      // chapters: {
      //   orderBy: {
      //     position: "asc",
      //   },
      // },
      attachments: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  if (!course) {
    return redirect("/");
  }

  return <div>CourseIdPage</div>;
};
export default CourseIdPage;
