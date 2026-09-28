import { describe, expect, it } from 'vitest';
import { Injectable } from '@/kernel/decorators/Injectable';
import { Container, ContainerError } from '@/kernel/di/Container';

abstract class Greeter {
  abstract greet(): string;
}

class PortugueseGreeter implements Greeter {
  greet() {
    return 'Olá';
  }
}

@Injectable()
class Welcome {
  constructor(readonly greeter: Greeter) {}
}

@Injectable()
class NeedsWelcome {
  constructor(readonly welcome: Welcome) {}
}

class CycleA {
  constructor(readonly b: unknown) {}
}

class CycleB {
  constructor(readonly a: unknown) {}
}

Reflect.defineMetadata('design:paramtypes', [CycleB], CycleA);
Reflect.defineMetadata('design:paramtypes', [CycleA], CycleB);

interface Greeting {
  text: string;
}

@Injectable()
class NeedsInterface {
  constructor(readonly greeting: Greeting) {}
}

class Undecorated {
  constructor(readonly greeter: Greeter) {}
}

describe('Container', () => {
  it('should inject dependencies by constructor type', () => {
    const container = new Container()
      .bind(Greeter, PortugueseGreeter, { scope: 'singleton' })
      .bind(Welcome, Welcome, { scope: 'transient' });

    expect(container.resolve(Welcome).greeter.greet()).toBe('Olá');
  });

  it('should reuse singletons and create transients every time', () => {
    const container = new Container()
      .bind(Greeter, PortugueseGreeter, { scope: 'singleton' })
      .bind(Welcome, Welcome, { scope: 'transient' });

    expect(container.resolve(Greeter)).toBe(container.resolve(Greeter));
    expect(container.resolve(Welcome)).not.toBe(container.resolve(Welcome));
  });

  it('should build factory bindings with the container', () => {
    const container = new Container()
      .bindFactory(Greeter, () => new PortugueseGreeter(), {
        scope: 'singleton',
      })
      .bindFactory(Welcome, (c) => new Welcome(c.resolve(Greeter)), {
        scope: 'transient',
      });

    expect(container.resolve(Welcome).greeter).toBe(container.resolve(Greeter));
  });

  it('should replace a binding bound again for the same token', () => {
    class EnglishGreeter implements Greeter {
      greet() {
        return 'Hello';
      }
    }
    const container = new Container()
      .bind(Greeter, PortugueseGreeter, { scope: 'singleton' })
      .bind(Greeter, EnglishGreeter, { scope: 'singleton' });

    expect(container.resolve(Greeter).greet()).toBe('Hello');
  });

  it('should fail to resolve an unbound token', () => {
    expect(() => new Container().resolve(Greeter)).toThrow(
      'No binding for Greeter.',
    );
  });

  it('should refuse a class with constructor parameters and no metadata', () => {
    expect(() =>
      new Container().bind(Undecorated, Undecorated, { scope: 'singleton' }),
    ).toThrow(ContainerError);
  });

  it('should refuse a parameter typed as an interface, which has no runtime class', () => {
    expect(() =>
      new Container().bind(NeedsInterface, NeedsInterface, {
        scope: 'singleton',
      }),
    ).toThrow(
      'Cannot inject parameter #0 of NeedsInterface: its type is not a class.',
    );
  });

  describe('validate', () => {
    it('should accept a complete graph', () => {
      const container = new Container()
        .bind(Greeter, PortugueseGreeter, { scope: 'singleton' })
        .bind(Welcome, Welcome, { scope: 'singleton' })
        .bind(NeedsWelcome, NeedsWelcome, { scope: 'transient' });

      expect(container.validate()).toBe(container);
    });

    it('should name the missing binding and who requires it', () => {
      const container = new Container().bind(Welcome, Welcome, {
        scope: 'singleton',
      });

      expect(() => container.validate()).toThrow(
        'No binding for Greeter, required by Welcome.',
      );
    });

    it('should detect circular dependencies', () => {
      const container = new Container()
        .bind(CycleA, CycleA, { scope: 'singleton' })
        .bind(CycleB, CycleB, { scope: 'singleton' });

      expect(() => container.validate()).toThrow(
        'Circular dependency: CycleA -> CycleB -> CycleA.',
      );
    });

    it('should refuse a singleton that depends on a transient', () => {
      const container = new Container()
        .bind(Greeter, PortugueseGreeter, { scope: 'transient' })
        .bind(Welcome, Welcome, { scope: 'singleton' });

      expect(() => container.validate()).toThrow(
        'Singleton Welcome cannot depend on transient Greeter.',
      );
    });
  });
});
