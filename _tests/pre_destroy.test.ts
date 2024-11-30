import { describe, it } from 'node:test'
import { expect } from 'expect'
import { fn as Spy } from 'jest-mock'
import { PreDestroy } from '../decorators/PreDestroy.js'
import { DI } from '../DI.js'
import { Injectable } from '../decorators/Injectable.js'

describe('PreDestroy', function () {
  it('should call method decorated with @PreDestroy() when the container is disposed', async function () {
    const nmspy = Spy()
    const mspy = Spy()

    class NonManaged {
      @PreDestroy()
      onDestroy() {
        nmspy()
      }
    }

    @Injectable()
    class Managed {
      @PreDestroy()
      onDestroy() {
        mspy()
      }
    }

    const di = DI.setup()
    di.initInstances()
    await di.dispose()

    expect(nmspy).not.toHaveBeenCalled()
    expect(mspy).toHaveBeenCalledTimes(1)
  })
})
