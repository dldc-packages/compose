import { ContextConsumer } from './Context';

export class MiidError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }

  public static InvalidMiddleware: typeof InvalidMiddleware;
  public static MissingContext: typeof MissingContext;
}

class InvalidMiddleware extends MiidError {
  constructor(public middleware: any, infos?: string) {
    super(`Invalid middleware${infos ? ': ' + infos : ''}`);
  }
}

class MissingContext extends MiidError {
  constructor(public context: ContextConsumer<any>) {
    super(`Missing Context`);
  }
}

MiidError.InvalidMiddleware = InvalidMiddleware;
MiidError.MissingContext = MissingContext;
