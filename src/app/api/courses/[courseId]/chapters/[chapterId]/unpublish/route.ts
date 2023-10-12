import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } }
) {
  try {
    const { userId } = auth();

    // check if user is not logged in and return unauthorized
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // check if user owns the course
    const ownCourse = await prisma.course.findUnique({
      where: {
        id: params.courseId,
        userId,
      },
    });

    // if not, return unauthorized
    if (!ownCourse) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // check if chapter exists then update it to be unpublished
    const unpublishedChapter = await prisma.chapter.update({
      where: {
        id: params.chapterId,
        courseId: params.courseId,
      },
      data: {
        isPublished: false,
      },
    });

    // INFO: course cannot be publish if atleast one chapter is not published

    // check if course has any published chapters
    const publishedChaptersInCourse = await prisma.chapter.findMany({
      where: {
        courseId: params.courseId,
        isPublished: true,
      },
    });

    // if there are no published chapters in the course, set course isPublished to false
    if (!publishedChaptersInCourse.length) {
      await prisma.course.update({
        where: {
          id: params.courseId,
        },
        data: {
          isPublished: false,
        },
      });
    }

    return NextResponse.json(unpublishedChapter);
  } catch (error) {
    console.log("[CHAPTER_UNPUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
