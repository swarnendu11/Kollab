import { headers } from "next/headers";
import NewMeetingClient from "./NewMeetingClient";

export const dynamic = "force-dynamic";

export default async function NewMeetingPage() {
  await headers();
  return <NewMeetingClient />;
}
