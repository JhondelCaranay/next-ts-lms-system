"use client";

import { useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

const NavbarRoutes = () => {
  const { userId } = useAuth();
  const pathname = usePathname();

  const isTeacherPage = pathname?.startsWith("/teacher");
  const isCoursePage = pathname?.includes("/courses");
  const isSearchPage = pathname === "/search";

  return <div>routes</div>;
};
export default NavbarRoutes;
