// deno-lint-ignore-file
import { expect } from "$std/expect/mod.ts";
import { spy } from "$std/testing/mock.ts";
import { compose, InvalidMiddlewareErreur } from "../mod.ts";

type MaybeAsync<T> = T | Promise<T>;

Deno.test("compose", async () => {
  const mock = spy();

  const mid = compose<number, MaybeAsync<string>>(
    (ctx, next) => {
      mock("middleware 1", ctx);
      return next(ctx + 1);
    },
    (ctx, next) => {
      mock("middleware 2", ctx);
      return next(ctx + 1);
    },
    (ctx, next) => {
      mock("middleware 3", ctx);
      return next(ctx + 1);
    },
  );

  const mid2 = compose(mid, (ctx, next) => {
    mock("done");
    return next(ctx);
  });

  const mid3 = compose(mid2, async (ctx, next) => {
    const tmp = await Promise.resolve(next(ctx));
    mock("tmp " + tmp);
    return tmp;
  });

  const res = await mid3(0, () => {
    mock("done 2");
    return "nope2";
  });

  expect(mock.calls).toEqual([
    {
      args: ["middleware 1", 0],
      returned: undefined,
    },
    {
      args: ["middleware 2", 1],
      returned: undefined,
    },
    {
      args: ["middleware 3", 2],
      returned: undefined,
    },
    {
      args: ["done"],
      returned: undefined,
    },
    {
      args: ["done 2"],
      returned: undefined,
    },
    {
      args: ["tmp nope2"],
      returned: undefined,
    },
  ]);
  expect(res).toBe("nope2");
});

Deno.test("Compose should throw on invalid middleware type", () => {
  expect(() => compose({} as any)).toThrow(Error);
  expect(() => compose({} as any)).toThrow(`Not a function at index 0`);
  let err: Error;
  try {
    compose({} as any);
  } catch (e) {
    err = e as any;
  }
  expect(err!).toBeInstanceOf(Error);
  expect(InvalidMiddlewareErreur.get(err!)).toEqual({
    middleware: {},
    infos: `Not a function at index 0`,
  });
});
