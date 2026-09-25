import 'reflect-metadata';

export type Token<T = unknown> = {
  readonly prototype: T;
  readonly name: string;
};

// biome-ignore lint/suspicious/noExplicitAny: implementations take injected args of any shape.
type Constructor<T> = new (...args: any[]) => T;

export type Scope = 'singleton' | 'transient';

type Binding =
  | { kind: 'class'; impl: Constructor<unknown>; scope: Scope; deps: Token[] }
  | {
      kind: 'factory';
      factory: (container: Container) => unknown;
      scope: Scope;
    };

export class ContainerError extends Error {
  override name = 'ContainerError';
}

export class Container {
  private readonly bindings = new Map<Token, Binding>();
  private readonly singletons = new Map<Token, unknown>();

  bind<T>(
    token: Token<T>,
    impl: Constructor<T>,
    { scope }: { scope: Scope },
  ): this {
    this.bindings.set(token, {
      kind: 'class',
      impl,
      scope,
      deps: readDeps(impl),
    });

    return this;
  }

  bindFactory<T>(
    token: Token<T>,
    factory: (container: Container) => T,
    { scope }: { scope: Scope },
  ): this {
    this.bindings.set(token, { kind: 'factory', factory, scope });

    return this;
  }

  resolve<T>(token: Token<T>): T {
    const binding = this.bindings.get(token);

    if (!binding) {
      throw new ContainerError(`No binding for ${describe(token)}.`);
    }

    if (binding.scope === 'singleton' && this.singletons.has(token)) {
      return this.singletons.get(token) as T;
    }

    const instance =
      binding.kind === 'class'
        ? new binding.impl(...binding.deps.map((dep) => this.resolve(dep)))
        : binding.factory(this);

    if (binding.scope === 'singleton') {
      this.singletons.set(token, instance);
    }

    return instance as T;
  }

  validate(): this {
    const done = new Set<Token>();
    const visiting: Token[] = [];

    const visit = (token: Token) => {
      if (done.has(token)) return;

      if (visiting.includes(token)) {
        const cycle = [...visiting.slice(visiting.indexOf(token)), token];

        throw new ContainerError(
          `Circular dependency: ${cycle.map(describe).join(' -> ')}.`,
        );
      }

      const binding = this.bindings.get(token);

      if (!binding) {
        const parent = visiting.at(-1);

        throw new ContainerError(
          `No binding for ${describe(token)}${parent ? `, required by ${describe(parent)}` : ''}.`,
        );
      }

      if (binding.kind === 'class') {
        visiting.push(token);

        for (const dep of binding.deps) {
          const depBinding = this.bindings.get(dep);

          if (
            binding.scope === 'singleton' &&
            depBinding?.scope === 'transient'
          ) {
            throw new ContainerError(
              `Singleton ${describe(token)} cannot depend on transient ${describe(dep)}.`,
            );
          }

          visit(dep);
        }

        visiting.pop();
      }

      done.add(token);
    };

    for (const token of this.bindings.keys()) visit(token);

    return this;
  }
}

function readDeps(impl: Constructor<unknown>): Token[] {
  const deps: unknown[] | undefined = Reflect.getMetadata(
    'design:paramtypes',
    impl,
  );

  if (!deps) {
    if (impl.length > 0) {
      throw new ContainerError(
        `${describe(impl)} has constructor parameters but no metadata. Is it decorated with @Injectable()?`,
      );
    }

    return [];
  }

  return deps.map((dep, index) => {
    if (typeof dep !== 'function' || dep === Object) {
      throw new ContainerError(
        `Cannot inject parameter #${index} of ${describe(impl)}: its type is not a class.`,
      );
    }
    return dep as Token;
  });
}

function describe(token: Token): string {
  return token.name || '<anonymous class>';
}
