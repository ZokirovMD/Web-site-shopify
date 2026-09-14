import { redirect } from "next/navigation";
import { Shell } from "@/components/shell/Shell";
import { currentUser } from "@/lib/auth/session";

/**
 * Настоящая проверка сессии — здесь, а не в middleware: тут есть база.
 * Middleware лишь отсекает запросы без куки, чтобы не ходить в базу зря.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/vhod");

  return <Shell>{children}</Shell>;
}
