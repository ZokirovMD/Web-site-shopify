/**
 * Генерирует SQL посева справочников из core/taxonomy.
 * Источник правды один — модуль, а не переписанный от руки список.
 */
import {
  CONTEXTS,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  MOTIVES,
  type CategoryNode,
} from "../core/taxonomy/index.ts";

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const n = (s: string | null | undefined) => (s ? q(s) : "NULL");
const out: string[] = [];

function emitCategory(node: CategoryNode, direction: "in" | "out", parent: string | null) {
  out.push(
    `INSERT INTO categories (id, user_id, name, direction, parent_id, color_role, source) ` +
      `SELECT ${q(node.id)}, id, ${q(node.name)}, ${q(direction)}::direction, ${n(parent)}, ` +
      `${n(node.colorRole)}, 'claude'::source FROM users ON CONFLICT DO NOTHING`,
  );
  for (const child of node.children ?? []) emitCategory(child, direction, node.id);
}

for (const node of EXPENSE_CATEGORIES) emitCategory(node, "out", null);
for (const node of INCOME_CATEGORIES) emitCategory(node, "in", null);

for (const c of CONTEXTS) {
  out.push(
    `INSERT INTO contexts (id, user_id, name, color_role, source) ` +
      `SELECT ${q(c.id)}, id, ${q(c.name)}, ${q(c.colorRole)}, 'claude'::source FROM users ON CONFLICT DO NOTHING`,
  );
}

for (const m of MOTIVES) {
  out.push(
    `INSERT INTO motives (id, user_id, name, hint, color_role, source) ` +
      `SELECT ${q(m.id)}, id, ${q(m.name)}, ${q(m.hint)}, ${q(m.colorRole)}, 'claude'::source FROM users ON CONFLICT DO NOTHING`,
  );
}

console.log(JSON.stringify(out, null, 0));
console.error(`инструкций: ${out.length}`);
