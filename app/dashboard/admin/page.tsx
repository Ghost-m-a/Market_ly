import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminConsole from "./AdminConsole";

export default async function AdminPage() {
   const session = await auth();
   if (!session?.user?.id || session.user.role !== "ADMIN") {
      redirect("/dashboard");
   }

   return <AdminConsole />;
}
