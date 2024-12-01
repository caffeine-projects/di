import { describe, it } from 'node:test'
import { expect } from 'expect'
import { Injectable } from '../decorators/Injectable.js'
import { property } from '../injections/injection_to_object'
import { propertyList } from '../injections/injection_to_object'
import { DI } from '../DI.js'
import { deps } from '../injections/injections.js'

describe('Injection Bag', function () {
  const kDep = Symbol('test')

  abstract class Base {}

  @Injectable()
  class Impl1 extends Base {}

  @Injectable()
  class Impl2 extends Base {}

  @Injectable()
  class Dep1 {}

  class Dep2 {}

  @Injectable(kDep)
  class Dep3 {}

  @Injectable([
    deps.object([
      property(Dep1, 'dep1'),
      { key: Dep2, optional: true, property: 'dep2' },
      property(kDep, 'dep3'),
      property(Base, 'base', { multiple: true }),
    ]),
  ])
  class Root {
    constructor(readonly args: { dep1: Dep1; dep2?: Dep2; dep3: Dep3; base: Base[] }) {}
  }

  @Injectable([
    deps.object([property(Dep1, 'dep1'), { key: Dep2, optional: true, property: 'dep2' }]),
    deps.object([property(kDep, 'dep3')]),
    deps.optional(Dep2),
    deps.injectAll(Base),
    deps.object([propertyList(Base, 'base')]),
  ])
  class DiffTypes {
    constructor(
      readonly args: { dep1: Dep1 },
      readonly other: { dep3: Dep3 },
      readonly dep2: Dep2 | undefined,
      readonly base: Base[],
      readonly another: { base: Base[] },
    ) {}
  }

  it('should resolve argument bag in same well it would resolve normal args', function () {
    const di = DI.setup()
    const root = di.get(Root)

    expect(root).toBeInstanceOf(Root)
    expect(root.args.dep1).toBeInstanceOf(Dep1)
    expect(root.args.dep2).toBeUndefined()
    expect(root.args.dep3).toBeInstanceOf(Dep3)
    expect(root.args.base).toHaveLength(2)
    expect(root.args.base.every(x => x instanceof Base)).toBeTruthy()
  })

  it('should resolve constructor mixing different argument types', function () {
    const di = DI.setup()
    const diff = di.get(DiffTypes)

    expect(diff).toBeInstanceOf(DiffTypes)
    expect(diff.args.dep1).toBeInstanceOf(Dep1)
    expect(diff.dep2).toBeUndefined()
    expect(diff.other.dep3).toBeInstanceOf(Dep3)
    expect(diff.base).toHaveLength(2)
    expect(diff.base.every(x => x instanceof Base)).toBeTruthy()
    expect(diff.another.base).toHaveLength(2)
    expect(diff.another.base.every(x => x instanceof Base)).toBeTruthy()
  })
})
