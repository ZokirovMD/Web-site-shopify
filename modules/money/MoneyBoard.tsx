import { getFormatter, getTranslations } from "next-intl/server";
import { Label, Node, Tile } from "@/design/primitives";
import { GirihEmpty } from "@/design/GirihEmpty";
import { addDays, type CalendarDate } from "@/core/date";
import { format, type Money } from "@/core/money";
import { burnRate, project, safeToSpend } from "@/core/projection";
import {
  loadDictionaries,
  loadMoneySnapshot,
  loadRecentTransactions,
  type Dictionary,
} from "@/db/queries/money";
import { findModule } from "@/components/shell/nav";
import { NewAccount } from "./NewAccount";
import { NewRule } from "./NewRule";
import { QuickEntry } from "./QuickEntry";
import { RuleToggle } from "./RuleToggle";
import styles from "./money.module.css";

const HORIZON_DAYS = 90;

/**
 * Экран ДЕНЬГИ.
 *
 * Порядок сверху вниз — порядок ответов на вопросы: сколько есть, откуда
 * считается, что записать, что повторяется, что уже было. Это не набор
 * карточек, а одна мысль.
 *
 * Никаких демонстрационных данных: пусто — значит пусто, и пустое состояние
 * объясняет, зачем этот раздел нужен.
 */
export async function MoneyBoard({
  userId,
  today,
}: {
  userId: string;
  today: CalendarDate;
}) {
  const [t, tc, formatter] = await Promise.all([
    getTranslations("money"),
    getTranslations("common"),
    getFormatter(),
  ]);

  const [snapshot, dictionaries, recent] = await Promise.all([
    loadMoneySnapshot(userId, today, addDays(today, HORIZON_DAYS)),
    loadDictionaries(userId),
    loadRecentTransactions(userId),
  ]);

  const { accounts, rules, settings } = snapshot;
  const live = accounts.filter((account) => !account.archived);
  const currency = settings.displayCurrency;
  const { phase } = findModule("dengi");

  /**
   * Узор звучит в полную силу один раз на страницу, а не в каждом пустом
   * блоке: три одинаковые розетки подряд — это уже обои, а не акцент
   * (docs/BRANDBOOK.md §2).
   */
  const blank = accounts.length === 0;

  /**
   * Проекция считается, только когда есть от чего. Без счетов движок вернёт
   * ряд нулей — это не ответ «ноль на счетах», это отсутствие данных,
   * и показывать его как число значит соврать.
   */
  const series = live.length > 0 ? project(snapshot.input) : [];
  const balanceNow = series[0]?.closing ?? null;
  const burn = series.length > 0 ? burnRate(series, currency) : null;
  const safe =
    series.length > 0 ? safeToSpend(series, settings.cashBuffer, currency) : null;

  const accountName = new Map(accounts.map((account) => [account.id, account.name]));
  const label = (list: readonly Dictionary[], id: string | null) =>
    id === null ? null : (list.find((item) => item.id === id)?.name ?? id);

  const humanDate = (date: CalendarDate) =>
    formatter.dateTime(new Date(`${date}T12:00:00Z`), "day");

  const amount = (value: Money) => format(value, { currency: false });

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <p className="o-label">{tc("phase", { n: phase })}</p>
          <h1 className={styles.title}>{t("title")}</h1>
        </div>
      </header>

      {/* Пока нет счетов, показывать «— UZS» незачем: это не ноль на счетах,
          это отсутствие данных. Строка итогов появляется вместе с ними. */}
      {balanceNow ? (
        <section className={styles.totals}>
          <div className={styles.cell}>
            <Label>{t("balanceNow")}</Label>
            <span className={styles.balance}>
              {amount(balanceNow)}
              <span className="o-numeral__currency">{currency}</span>
            </span>
          </div>
          {burn ? (
            <div className={styles.cell}>
              <Label>{t("burnDaily")}</Label>
              <span className={styles.cellValue}>{amount(burn)}</span>
            </div>
          ) : null}
          {safe ? (
            <div className={styles.cell}>
              <Label>{t("safeToSpend")}</Label>
              <span className={`${styles.cellValue} ${styles.in}`}>{amount(safe)}</span>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* ---- Счета ---- */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <Node role="turquoise" />
          <span className={styles.sectionTitle}>{t("accounts.title")}</span>
        </div>

        <details className={styles.disclosure}>
          <summary>{t("accounts.add")}</summary>
          <NewAccount />
        </details>

        {accounts.length === 0 ? (
          <div className={styles.empty}>
            {blank ? <GirihEmpty size={132} /> : null}
            <div className={styles.emptyText}>
              <span className={styles.emptyTitle}>{t("accounts.empty.title")}</span>
              <p className={styles.emptyBody}>{t("accounts.empty.body")}</p>
            </div>
          </div>
        ) : (
          <div className={styles.rows}>
            {accounts.map((account) => (
              <div
                key={account.id}
                className={`${styles.row} ${account.archived ? styles.dim : ""}`}
              >
                <span className={styles.rowName}>{account.name}</span>
                <span className={styles.rowMeta}>
                  {t(`accounts.kinds.${account.kind}`)}
                  {account.archived ? ` · ${t("accounts.archived")}` : ""}
                </span>
                <span className={styles.rowAmount}>
                  {format(account.openingBalance)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---- Быстрый ввод. Без счёта записывать некуда ---- */}
      {live.length > 0 ? (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <Node role="lapis" />
            <span className={styles.sectionTitle}>{t("entry.title")}</span>
          </div>
          <QuickEntry accounts={live} dictionaries={dictionaries} today={today} />
        </section>
      ) : null}

      {/* ---- Правила ---- */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <Node role="ochre" />
          <span className={styles.sectionTitle}>{t("rules.title")}</span>
        </div>

        {live.length > 0 ? (
          <details className={styles.disclosure}>
            <summary>{t("rules.add")}</summary>
            <NewRule accounts={live} dictionaries={dictionaries} today={today} />
          </details>
        ) : null}

        {rules.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyText}>
              <span className={styles.emptyTitle}>{t("rules.empty.title")}</span>
              <p className={styles.emptyBody}>{t("rules.empty.body")}</p>
            </div>
          </div>
        ) : (
          <div className={styles.rows}>
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`${styles.row} ${rule.active ? "" : styles.dim}`}
              >
                <span className={styles.rowName}>{rule.name}</span>
                <span className={styles.rowMeta}>
                  {t(`rules.every.${rule.cadence}`, { n: rule.interval })}
                  {rule.cadence === "monthly" && rule.dayOfMonth
                    ? ` · ${t("rules.onDay", { day: rule.dayOfMonth })}`
                    : ""}
                  {` · ${accountName.get(rule.accountId) ?? ""}`}
                </span>
                <span
                  className={`${styles.rowAmount} ${
                    rule.direction === "in" ? styles.in : styles.out
                  }`}
                >
                  {format(rule.amount, { currency: false })}
                </span>
                <RuleToggle id={rule.id} active={rule.active} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---- Лента ---- */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <Node role="muted" />
          <span className={styles.sectionTitle}>{t("ledger.title")}</span>
        </div>

        {recent.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyText}>
              <span className={styles.emptyTitle}>{t("ledger.empty.title")}</span>
              <p className={styles.emptyBody}>{t("ledger.empty.body")}</p>
            </div>
          </div>
        ) : (
          <Tile>
            <div className={styles.rows}>
              {recent.map((tx) => {
                const marks = [
                  label(dictionaries.categories, tx.categoryId),
                  label(dictionaries.contexts, tx.contextId),
                  label(dictionaries.motives, tx.motiveId),
                  tx.place,
                ].filter((mark): mark is string => Boolean(mark));

                return (
                  <div key={tx.id} className={styles.row}>
                    <span className={styles.rowDate}>{humanDate(tx.occurredOn)}</span>
                    <span className={styles.rowName}>
                      {tx.note ?? accountName.get(tx.accountId) ?? ""}
                    </span>
                    <span className={styles.rowMarks}>{marks.join(" · ")}</span>
                    <span
                      className={`${styles.rowAmount} ${
                        tx.direction === "in" ? styles.in : styles.out
                      }`}
                    >
                      {format(tx.amount, { currency: false })}
                    </span>
                  </div>
                );
              })}
            </div>
          </Tile>
        )}
      </section>
    </div>
  );
}
