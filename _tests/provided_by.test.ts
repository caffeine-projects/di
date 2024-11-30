import { beforeEach, describe, it } from 'node:test'
import { expect } from 'expect'
import { fn as Spy } from 'jest-mock'
import { Injectable } from '../decorators/Injectable.js'
import { ProvidedBy } from '../decorators/ProvidedBy.js'
import { DI } from '../DI.js'
import { ClassProvider } from '../internal/providers/ClassProvider.js'
import { Provider } from '../Provider.js'
import { ResolutionContext } from '../ResolutionContext.js'

describe('Provided By', function () {
  const spy = Spy()

  beforeEach(() => {
    spy.mockReset()
  })

  class LogSetterProvider<T> implements Provider<T> {
    constructor(private readonly provider: () => Provider<T>) {}

    provide(ctx: ResolutionContext): T {
      const instance = this.provider().provide(ctx)

      spy()

      return instance
    }
  }

  @Injectable()
  @ProvidedBy(new LogSetterProvider(() => new ClassProvider(Loggable)))
  class Loggable {
    static Log() {
      return 'the_log'
    }
  }

  @Injectable()
  @ProvidedBy(() => {
    spy()
    return new Dep('created')
  })
  class Dep {
    constructor(readonly status: string) {}
  }

  it('should use custom provider provided in the decorator', function () {
    const di = DI.setup()
    const loggable = di.get(Loggable)

    expect(Loggable.Log()).toEqual('the_log')
    expect(loggable).toBeInstanceOf(Loggable)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('should use a factory provider using the function provided in the decorator', function () {
    const di = DI.setup()
    const dep = di.get(Dep)

    expect(spy).toHaveBeenCalledTimes(1)
    expect(dep).toBeInstanceOf(Dep)
  })
})
