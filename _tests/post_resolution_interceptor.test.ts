import { describe, it, beforeEach } from 'node:test'
import { expect } from 'expect'
import { fn as Spy } from 'jest-mock'
import { Injectable } from '../decorators/Injectable.js'
import { Interceptor } from '../decorators/Interceptor.js'
import { PostResolutionInterceptor } from '../PostResolutionInterceptor.js'
import { ResolutionContext } from '../ResolutionContext.js'
import { DI } from '../DI.js'
import { Bean } from '../decorators/Bean.js'
import { Configuration } from '../decorators/Configuration'

describe('Post Resolution Interceptor', function () {
  const spy1 = Spy()
  const spy2 = Spy()

  beforeEach(() => {
    spy1.mockReset()
    spy2.mockReset()
  })

  class TestInterceptor implements PostResolutionInterceptor {
    intercept(instance: any, ctx: ResolutionContext): any {
      spy1()
      return instance
    }
  }

  @Injectable()
  @Interceptor(new TestInterceptor())
  @Interceptor((instance, ctx) => {
    spy2()
    return instance
  })
  class Dep {}

  class Comp {}

  @Configuration()
  class Conf {
    @Bean(Comp)
    @Interceptor(new TestInterceptor())
    @Interceptor((instance, ctx) => {
      spy2()
      return instance
    })
    comp() {
      return new Comp()
    }
  }

  describe('using post interceptor on class level', function () {
    it('should register multiple post resolution interceptors', function () {
      const di = DI.setup()
      const dep = di.get(Dep)

      expect(dep).toBeInstanceOf(Dep)
      expect(spy1).toHaveBeenCalledTimes(1)
      expect(spy2).toHaveBeenCalledTimes(1)
    })
  })

  describe('using post interceptor on configuration class', function () {
    it('should register multiple post resolution interceptors', function () {
      const di = DI.setup()
      const dep = di.get(Comp)

      expect(dep).toBeInstanceOf(Comp)
      expect(spy1).toHaveBeenCalledTimes(1)
      expect(spy2).toHaveBeenCalledTimes(1)
    })
  })
})
