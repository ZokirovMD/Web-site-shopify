import { redirect } from "next/navigation";
import { getTimeZone } from "next-intl/server";
import { GirihGround } from "@/design/GirihGround";
import { addDays, todayIn } from "@/core/date";
import { project } from "@/core/projection";
import { loadGoals, loadMoneySnapshot } from "@/db/queries/money";
import { TIME_ZONE } from "@/i18n/config";
import { currentUser } from "@/lib/auth/session";
import { PulseBoard } from "./PulseBoard";

const HORIZON_DAYS = 90;

/**
 * ПУЛЬС считается на сервере.
 *
 * Движок проекций — чистая функция, и гонять её в браузере смысла нет: там
 * пришлось бы сначала выкачать все операции за всю историю. Наверх уходит
 * готовый ряд остатков по дням, скраббер только выбирает из него день.
 */
export default async function PulsePage() {
  const user = await currentUser();
  if (!user) redirect("/vhod");

  const timeZone = (await getTimeZone()) ?? TIME_ZONE;
  const today = todayIn(timeZone);

  const [snapshot, goals] = await Promise.all([
    loadMoneySnapshot(user.id, today, addDays(today, HORIZON_DAYS)),
    loadGoals(user.id),
  ]);

  // Без живых счетов проекция вернула бы ряд нулей. Ноль — это ответ «на счетах
  // ноль», а у нас случай «счетов нет». Разные вещи, и показывать их одинаково
  // нельзя: пустой ряд включает пустое состояние.
  const hasAccounts = snapshot.accounts.some((account) => !account.archived);
  const series = hasAccounts ? project(snapshot.input) : [];

  return (
    <>
      <GirihGround />
      <PulseBoard
        series={series}
        start={today}
        currency={snapshot.settings.displayCurrency}
        buffer={snapshot.settings.cashBuffer}
        goals={goals}
      />
    </>
  );
}
