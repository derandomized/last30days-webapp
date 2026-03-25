import { redirect } from "next/navigation";

export default function Home() {
  redirect("/last30days");
}
