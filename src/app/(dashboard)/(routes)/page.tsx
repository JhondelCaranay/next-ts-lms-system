import { UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="">
      <p className="underline">protected page s</p>
      <UserButton afterSignOutUrl="/" />
    </main>
  );
}
