import test from "node:test";
import assert from "node:assert/strict";
import { selectTopN, tierFor } from "./filter";

const cfg = { topN: 30, rankBy: "gmv" as const, tier1Gmv: 10000, tier2Gmv: 5000 };

test("tierFor classifica corretamente", () => {
  assert.equal(tierFor(12000, 10000, 5000), "tier1");
  assert.equal(tierFor(10000, 10000, 5000), "tier1");
  assert.equal(tierFor(7000, 10000, 5000), "tier2");
  assert.equal(tierFor(5000, 10000, 5000), "tier2");
  assert.equal(tierFor(3000, 10000, 5000), "below");
});

test("selectTopN ranqueia por GMV desc e limita ao topN", () => {
  const items = Array.from({ length: 40 }, (_, i) => ({ id: i, gmv: (40 - i) * 1000 }));
  const top = selectTopN(items, cfg);
  assert.equal(top.length, 30);
  assert.equal(top[0]!.rank, 1);
  assert.equal(top[0]!.gmv, 40000);
  assert.equal(top[0]!.tier, "tier1");
  assert.equal(top[29]!.rank, 30);
  assert.ok(top[29]!.gmv < top[0]!.gmv);
});

test("selectTopN respeita rankBy=orders", () => {
  const items = [
    { id: "a", gmv: 9000, orders: 5 },
    { id: "b", gmv: 20000, orders: 2 },
    { id: "c", gmv: 12000, orders: 9 },
  ];
  const top = selectTopN(items, { ...cfg, rankBy: "orders" });
  assert.equal(top[0]!.id, "c");
  assert.equal(top[0]!.tier, "tier1");
});

test("selectTopN desempata por GMV", () => {
  const items = [
    { id: "a", gmv: 8000, orders: 3 },
    { id: "b", gmv: 9000, orders: 3 },
  ];
  const top = selectTopN(items, cfg);
  assert.equal(top[0]!.id, "b");
});
