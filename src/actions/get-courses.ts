import { prisma } from "@/lib/prisma";
import { Category, Course } from "@prisma/client";
import { getProgress } from "./get-progress";

type CourseWithProgressWithCategory = Course & {
  category: Category | null;
  chapters: { id: string }[];
  progress: number | null;
};

type GetCoursesProps = {
  userId: string;
  title?: string;
  categoryId?: string;
};

export const getCourses = async ({
  userId,
  title,
  categoryId,
}: GetCoursesProps): Promise<CourseWithProgressWithCategory[]> => {
  try {
    // get all published courses with the given title and category id
    const courses = await prisma.course.findMany({
      where: {
        isPublished: true,
        title: {
          contains: title,
        },
        categoryId,
      },
      include: {
        // get the category of the course
        category: true,
        // get all ids of published chapters
        chapters: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
          },
        },
        // get all purchases of the course for the user
        purchases: {
          where: {
            userId,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // get the progress of the user for each course
    const coursesWithProgress: CourseWithProgressWithCategory[] = await Promise.all(
      courses.map(async (course) => {
        // if the user has not purchased the course, return the course without progress
        if (course.purchases.length === 0) {
          return {
            ...course,
            progress: null,
          };
        }

        // get the progress of the user for the course
        const progressPercentage = await getProgress(userId, course.id);

        // return the course with the progress
        return {
          ...course,
          progress: progressPercentage,
        };
      })
    );

    return coursesWithProgress;
  } catch (error) {
    console.log("[GET_COURSES]", error);
    return [];
  }
};
