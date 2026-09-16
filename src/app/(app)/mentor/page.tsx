import { Suspense } from "react";
import { MentorChat } from "@/components/mentor/mentor-chat";

export default function MentorPage() {
  return (
    <Suspense>
      <MentorChat />
    </Suspense>
  );
}
