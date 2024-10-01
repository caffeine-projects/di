import { expect } from '@jest/globals'
import { jest } from '@jest/globals'
import { PreDestroy } from '../decorators/PreDestroy.js'
import { DI } from '../DI.js'
import { Injectable } from '../decorators/Injectable.js'

describe('PreDestroy', function () {
  it('should call method decorated with @PreDestroy() when the container is disposed', async function () {
    const nmspy = jest.fn()
    const mspy = jest.fn()

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
