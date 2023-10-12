import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import Mux from "@mux/mux-node";

const { Video } = new Mux(process.env.MUX_TOKEN_ID!, process.env.MUX_TOKEN_SECRET!);

export async function DELETE(
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

    // if not, return not found
    if (!chapter) {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (chapter.videoUrl) {
      // check if mux data exists
      const existingMuxData = await prisma.muxData.findFirst({
        where: {
          chapterId: params.chapterId,
        },
      });

      // if exists, delete asset and mux data
      if (existingMuxData) {
        // delete asset
        await Video.Assets.del(existingMuxData.assetId);
        // delete mux data from database
        await prisma.muxData.delete({
          where: {
            id: existingMuxData.id,
          },
        });
      }
    }

    // delete chapter
    const deletedChapter = await prisma.chapter.delete({
      where: {
        id: params.chapterId,
      },
    });

    // INFO: course cannot be publish if atleast one chapter is not published

    // check if there are any published chapters in the course
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

    return NextResponse.json(deletedChapter);
  } catch (error) {
    console.log("[CHAPTER_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } }
) {
  try {
    const { userId } = auth();
    const { isPublished, ...values } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const ownCourse = await prisma.course.findUnique({
      where: {
        id: params.courseId,
        userId,
      },
    });

    if (!ownCourse) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const chapter = await prisma.chapter.update({
      where: {
        id: params.chapterId,
        courseId: params.courseId,
      },
      data: {
        ...values,
      },
    });

    if (values.videoUrl) {
      const existingMuxData = await prisma.muxData.findFirst({
        where: {
          chapterId: params.chapterId,
        },
      });

      if (existingMuxData) {
        await Video.Assets.del(existingMuxData.assetId);
        await prisma.muxData.delete({
          where: {
            id: existingMuxData.id,
          },
        });
      }

      const asset = await Video.Assets.create({
        input: values.videoUrl,
        playback_policy: "public",
        test: false,
      });

      await prisma.muxData.create({
        data: {
          chapterId: params.chapterId,
          assetId: asset.id,
          playbackId: asset.playback_ids?.[0]?.id,
        },
      });
    }

    return NextResponse.json(chapter);
  } catch (error) {
    console.log("[COURSES_CHAPTER_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
