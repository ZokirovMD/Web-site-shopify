import { redirect } from "next/navigation";
import { getTimeZone } from "next-intl/server";
import { MoneyBoard } from "@/modules/money/MoneyBoard";
import { moduleMetadata } from "@/lib/metadata";
import { todayIn } from "@/core/date";
import { TIME_ZONE } from "@/i18n/config";
import { currentUser } from "@/lib/auth/session";

export const generateMetadata = () => moduleMetadata("dengi");

export default async function Page() {
  const user = await currentUser();
  if (!user) redirect("/vhod");

  // «Сегодня» считается один раз на сервере, в поясе владельца, и уходит
  // в формы. Иначе браузер в другом поясе подставит в дату другой день.
  const timeZone = (await getTimeZone()) ?? TIME_ZONE;

  return <MoneyBoard userId={user.id} today={todayIn(timeZone)} />;
}
