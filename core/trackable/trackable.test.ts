import { describe, expect, it } from "vitest";
import { calendarDate as d } from "@/core/date";
import {
  TransitionError,
  archive,
  canTransition,
  complete,
  isOpen,
  isOverdue,
  planOn,
  scheduledOn,
  transition,
  type Trackable,
} from "./index";

function make(partial: Partial<Trackable> = {}): Trackable {
  return {
    id: "t1",
    kind: "learning",
    title: "Курс по питону",
    status: "suggested",
    plannedFor: [],
    source: "claude",
    ...partial,
  };
}

describe("сценарий владельца: предложил → принял → запланировал → посмотрел", () => {
  it("проходит весь путь и закрывается", () => {
    let item = make();
    expect(item.status).toBe("suggested");

    item = transition(item, "accepted", { on: d("2026-01-01") });
    expect(item.status).toBe("accepted");

    item = planOn(item, [d("2026-01-05"), d("2026-01-07")]);
    expect(item.status).toBe("planned");
    expect(item.plannedFor).toEqual(["2026-01-05", "2026-01-07"]);

    item = complete(item, d("2026-01-07"));
    expect(item.status).toBe("done");
    expect(item.completedOn).toBe("2026-01-07");
    expect(isOpen(item)).toBe(false);
  });

  it("не мутирует исходный объект — отмена это просто замена", () => {
    const before = make({ status: "accepted" });
    const after = complete(before, d("2026-01-07"));
    expect(before.status).toBe("accepted");
    expect(after.status).toBe("done");
  });
});

describe("переходы", () => {
  it("запрещает прыгнуть из предложенного сразу в сделанное", () => {
    expect(canTransition("suggested", "done")).toBe(false);
    expect(() => complete(make(), d("2026-01-01"))).toThrow(TransitionError);
  });

  it("разрешает вернуть сделанное в работу — ошиблись галочкой", () => {
    const done = make({ status: "done", completedOn: d("2026-01-07") });
    const back = transition(done, "doing", { on: d("2026-01-08") });
    expect(back.status).toBe("doing");
    expect(back.completedOn).toBeNull();
  });

  it("снимает дату завершения при возврате — иначе архив соврёт", () => {
    const done = make({ status: "done", completedOn: d("2026-01-07") });
    expect(transition(done, "doing", { on: d("2026-01-08") }).completedOn).toBeNull();
  });

  it("запоминает причину отказа и очищает её при возврате", () => {
    const dropped = transition(make(), "dropped", { on: d("2026-01-01"), reason: "дорого" });
    expect(dropped.droppedReason).toBe("дорого");

    const back = transition(dropped, "accepted", { on: d("2026-01-02") });
    expect(back.status).toBe("accepted");
    expect(back.droppedReason).toBeNull();
  });

  it("считает переход в самого себя допустимым — повторное нажатие не ломает", () => {
    expect(canTransition("done", "done")).toBe(true);
  });
});

describe("планирование", () => {
  it("убирает дубли и сортирует дни", () => {
    const item = planOn(make({ status: "accepted" }), [
      d("2026-01-07"),
      d("2026-01-05"),
      d("2026-01-07"),
    ]);
    expect(item.plannedFor).toEqual(["2026-01-05", "2026-01-07"]);
  });

  it("не откатывает статус назад, если работа уже идёт", () => {
    const item = planOn(make({ status: "doing" }), [d("2026-01-05")]);
    expect(item.status).toBe("doing");
  });

  it("находит запланированное на день — из этого собирается ПУЛЬС", () => {
    const a = planOn(make({ id: "a", status: "accepted" }), [d("2026-01-05")]);
    const b = planOn(make({ id: "b", status: "accepted" }), [d("2026-01-06")]);
    expect(scheduledOn([a, b], d("2026-01-05")).map((x) => x.id)).toEqual(["a"]);
  });
});

describe("просрочка", () => {
  it("ловит открытое, запланированное на прошедший день", () => {
    const item = planOn(make({ status: "accepted" }), [d("2026-01-05")]);
    expect(isOverdue(item, d("2026-01-10"))).toBe(true);
  });

  it("не считает просроченным то, что уже сделано", () => {
    let item = planOn(make({ status: "accepted" }), [d("2026-01-05")]);
    item = complete(item, d("2026-01-05"));
    expect(isOverdue(item, d("2026-01-10"))).toBe(false);
  });

  it("не считает просроченным незапланированное", () => {
    expect(isOverdue(make({ status: "accepted" }), d("2026-01-10"))).toBe(false);
  });
});

describe("архив — список того, чему обучался", () => {
  const items: Trackable[] = [
    make({ id: "1", status: "done", completedOn: d("2026-01-07"), title: "Питон" }),
    make({ id: "2", status: "done", completedOn: d("2026-02-20"), title: "Статистика" }),
    make({ id: "3", status: "accepted", title: "Не начатый" }),
    make({ id: "4", kind: "training", status: "done", completedOn: d("2026-01-09") }),
  ];

  it("отдаёт завершённое за период, новое сверху", () => {
    const result = archive(items, { from: d("2026-01-01"), to: d("2026-12-31") });
    expect(result.map((x) => x.id)).toEqual(["2", "4", "1"]);
  });

  it("фильтрует по виду — только обучение", () => {
    const result = archive(items, {
      from: d("2026-01-01"),
      to: d("2026-12-31"),
      kind: "learning",
    });
    expect(result.map((x) => x.id)).toEqual(["2", "1"]);
  });

  it("не пускает в архив незавершённое", () => {
    const result = archive(items, { from: d("2026-01-01"), to: d("2026-12-31") });
    expect(result.some((x) => x.id === "3")).toBe(false);
  });

  it("уважает границы периода", () => {
    const result = archive(items, { from: d("2026-02-01"), to: d("2026-02-28") });
    expect(result.map((x) => x.id)).toEqual(["2"]);
  });
});
