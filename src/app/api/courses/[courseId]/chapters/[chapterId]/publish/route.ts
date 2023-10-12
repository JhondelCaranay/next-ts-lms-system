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

    // check if chapter exists
    const chapter = await prisma.chapter.findUnique({
      where: {
        id: params.chapterId,
        courseId: params.courseId,
      },
    });

    // check if mux data exists
    const muxData = await prisma.muxData.findUnique({
      where: {
        chapterId: params.chapterId,
      },
    });

    // return bad request if any of the required fields are missing
    if (!chapter || !muxData || !chapter.title || !chapter.description || !chapter.videoUrl) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // update chapter to be published
    const publishedChapter = await prisma.chapter.update({
      where: {
        id: params.chapterId,
        courseId: params.courseId,
      },
      data: {
        isPublished: true,
      },
    });

    return NextResponse.json(publishedChapter);
  } catch (error) {
    console.log("[CHAPTER_PUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
