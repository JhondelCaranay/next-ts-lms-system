import { prisma } from "@/lib/prisma";

export const getProgress = async (userId: string, courseId: string): Promise<number> => {
  try {
    // get all published chapters for the course
    const publishedChapters = await prisma.chapter.findMany({
      where: {
        courseId: courseId,
        isPublished: true,
      },
      select: {
        id: true,
      },
    });

    // get all completed chapters ids, array of chapter ids
    const publishedChapterIds = publishedChapters.map((chapter) => chapter.id);

    // get all completed chapters for the user
    const validCompletedChapters = await prisma.userProgress.count({
      where: {
        userId: userId,
        chapterId: {
          in: publishedChapterIds,
        },
        isCompleted: true,
      },
    });

    // calculate the user progress of completed chapters   (completed chapters / total chapters) * 100 = progress percentage
    const progressPercentage = (validCompletedChapters / publishedChapterIds.length) * 100;

    // return the progress percentage
    return progressPercentage;
  } catch (error) {
    console.log("[GET_PROGRESS]", error);
    return 0;
  }
};
