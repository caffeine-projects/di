import { describe, it } from 'node:test'
import { expect } from 'expect'
import { fn as Spy } from 'jest-mock'
import { DI } from '../DI.js'
import { ConditionalOn } from '../decorators/ConditionalOn.js'
import { Namespace } from '../decorators/Namespace.js'
import { Bean } from '../decorators/Bean.js'
import { Injectable } from '../decorators/Injectable.js'
import { PreDestroy } from '../decorators/PreDestroy.js'
import { Inject } from '../decorators/Inject.js'
import { Configuration } from '../decorators/Configuration'

describe('Container Lifecycle Listener', function () {
  const spy = Spy()

  // 1
  @Injectable()
  class Dep {}

  // 1
  class Incomplete {
    @PreDestroy()
    hi() {}
  }

  // 1
  class IncompleteWithProp {
    @Inject('')
    message!: string
  }

  // 2
  @Injectable()
  @ConditionalOn(() => false)
  class NotValid {}

  // 3
  @Injectable()
  @Namespace('test')
  class OtherNamespace {}

  // 4
  @Configuration()
  class Conf {
    // 5
    @Bean(Symbol('test1'))
    @ConditionalOn(() => false)
    test1() {
      return 'test1'
    }

    // 6
    @Bean(Symbol('test2'))
    test2() {
      return 'test2'
    }
  }

  it('should call inspector methods on container specific registration steps', async function () {
    const di = new DI()

    di.hooks.on('onSetup', a => spy())
    di.hooks.on('onBindingRegistered', a => spy())
    di.hooks.on('onBindingNotRegistered', a => spy())
    di.hooks.on('onSetupComplete', a => spy())
    di.hooks.on('onDisposed', a => spy())

    di.setup()

    await di.dispose()

    expect(spy).toHaveBeenCalledTimes(14)
  })
})
