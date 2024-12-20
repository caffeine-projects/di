import { describe, it } from 'node:test'
import { expect } from 'expect'
import { fn as Spy } from 'jest-mock'
import { Injectable } from '../decorators/Injectable.js'
import { Lazy } from '../decorators/Lazy.js'
import { Scoped } from '../decorators/Scoped.js'
import { DI } from '../DI.js'
import { Lifecycle } from '../Lifecycle.js'

describe('Init Singleton and Container Scoped', function () {
  const spy1 = Spy()
  const spy2 = Spy()
  const spy3 = Spy()
  const spy4 = Spy()
  const spy5 = Spy()

  @Injectable()
  class Dep1 {
    constructor() {
      spy1()
    }
  }

  @Injectable()
  @Scoped(Lifecycle.CONTAINER)
  class Dep2 {
    constructor() {
      spy2()
    }
  }

  @Injectable()
  @Scoped(Lifecycle.TRANSIENT)
  class Dep3 {
    constructor() {
      spy3()
    }
  }

  @Injectable()
  @Lazy()
  class Dep4 {
    constructor() {
      spy4()
    }
  }

  @Injectable()
  @Scoped(Lifecycle.TRANSIENT)
  @Lazy(false)
  class Dep5 {
    constructor() {
      spy5()
    }
  }

  it('should init all injectables except ones marked as lazy', function () {
    const di = DI.setup()

    di.initInstances()

    const dep1 = di.get(Dep1)
    const dep2 = di.get(Dep2)

    expect(spy1).toHaveBeenCalledTimes(1)
    expect(spy2).toHaveBeenCalledTimes(1)
    expect(spy3).not.toHaveBeenCalled()
    expect(spy4).not.toHaveBeenCalled()
    expect(spy5).toHaveBeenCalledTimes(0)
    expect(dep1).toBeInstanceOf(Dep1)
    expect(dep2).toBeInstanceOf(Dep2)
  })
})
