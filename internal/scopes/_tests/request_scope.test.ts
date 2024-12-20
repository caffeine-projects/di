import Http from 'http'
import { IncomingMessage, ServerResponse } from 'http'
import Supertest from 'supertest'
import { after, beforeEach, describe, it } from 'node:test'
import { fn as Spy } from 'jest-mock'
import { expect } from 'expect'
import { v4 } from 'uuid'
import { Injectable } from '../../../decorators/Injectable.js'
import { RequestScoped } from '../../../decorators/RequestScoped.js'
import { DI } from '../../../DI.js'
import { RequestScope } from '../RequestScope.js'
import { typeRegistrar } from '../../TypeRegistrar.js'
import { PostConstruct } from '../../../decorators/PostConstruct.js'
import { PreDestroy } from '../../../decorators/PreDestroy.js'
import { Lifecycle } from '../../../Lifecycle.js'

describe('Request Scope', function () {
  const scope = DI.getScope<RequestScope>(Lifecycle.REQUEST)
  const ctorSpy = Spy()
  const initSpy = Spy()
  const destroySpy = Spy()
  const singletonSpy = Spy()

  @Injectable()
  @RequestScoped()
  class Ctrl {
    readonly id: string = v4()

    constructor() {
      ctorSpy()
    }

    value() {
      return 'hello world'
    }

    @PostConstruct()
    init() {
      initSpy()
    }

    @PreDestroy()
    dispose() {
      destroySpy()
    }
  }

  @Injectable([Ctrl])
  class SingletonWithReq {
    constructor(readonly req: Ctrl) {
      singletonSpy()
    }
  }

  const di = DI.setup()

  async function requestListener(req: IncomingMessage, res: ServerResponse) {
    scope.activate()

    const ctrl = di.get(Ctrl)

    res.writeHead(200)
    res.end(ctrl.value())

    await scope.finish()
  }

  const server = Http.createServer(requestListener)

  after(async () => {
    typeRegistrar.remove(Ctrl)
    server.close()

    await di.dispose()
  })

  beforeEach(() => {
    singletonSpy.mockReset()
    initSpy.mockReset()
    destroySpy.mockReset()
  })

  it('should fail when trying to', function () {
    expect(() => di.get(Ctrl)).toThrow()
  })

  it('should fail when entering twice on request scope', async function () {
    scope.activate()
    expect(() => scope.activate()).toThrow()
    await scope.finish()
  })

  it('should fail when exiting from non entered request scope', function () {
    expect(() => scope.finish()).toThrow()
  })

  describe('non request scoped with a request scope dependency', function () {
    it('should fail to resolve root component when not inside a request scope', function () {
      expect(() => di.get(SingletonWithReq)).toThrow()
    })
  })

  describe('when performing http requests', function () {
    it('should ', async function () {
      const val = 'hello world'

      expect(() => di.get(Ctrl)).toThrow()

      await Supertest(server)
        .get('/')
        .expect(200)
        .expect(res => expect(res.text).toEqual(val))

      await Supertest(server)
        .get('/')
        .expect(200)
        .expect(res => expect(res.text).toEqual(val))

      expect(ctorSpy).toHaveBeenCalledTimes(2)
      expect(initSpy).toHaveBeenCalledTimes(2)
      expect(destroySpy).toHaveBeenCalledTimes(2)

      expect(() => di.get(Ctrl)).toThrow()
    })
  })
})
