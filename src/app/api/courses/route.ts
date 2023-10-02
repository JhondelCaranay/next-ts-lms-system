import { auth } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";

import { isTeacher } from "@/lib/teacher";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    const { title } = await req.json();

    if (!userId) {
      // || !isTeacher(userId)
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const course = await prisma.course.create({
      data: {
        userId,
        title,
      },
    });

    return NextResponse.json(course);
  } catch (error) {
    console.log("[COURSES]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
