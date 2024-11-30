import { v4 } from 'uuid'
import { describe, it } from 'node:test'
import { expect } from 'expect'
import { Lifecycle } from '../../../Lifecycle.js'
import { Refresh } from '../../../decorators/Refresh.js'
import { DI } from '../../../DI.js'
import { RefreshScope } from '../RefreshScope.js'
import { Scoped } from '../../../decorators/Scoped.js'
import { Injectable } from '../../../decorators/Injectable.js'

describe('Refresh Scope', function () {
  @Injectable()
  @Scoped(Lifecycle.REFRESH)
  class Dep {
    readonly id: string = v4()

    fn(): string {
      return 'test'
    }
  }

  @Injectable([Dep])
  @Refresh()
  class Root {
    readonly id: string = v4()

    constructor(readonly dep: Dep) {}

    msg(): string {
      return this.dep.fn() + ' dev'
    }
  }

  @Injectable()
  class Out {
    readonly id: string = v4()

    hi(): string {
      return 'tchau'
    }
  }

  describe('when request a scope refresh', function () {
    it('should reset refresh scoped components', async function () {
      const di = DI.setup()
      const scope = DI.getScope<RefreshScope>(Lifecycle.REFRESH)

      const root = di.get(Root)
      const out = di.get(Out)

      expect(root).toEqual(di.get(Root))
      expect(root.id).toEqual(di.get(Root).id)
      expect(root.msg()).toEqual('test dev')
      expect(out).toEqual(di.get(Out))
      expect(out.id).toEqual(di.get(Out).id)
      expect(out.hi()).toEqual('tchau')

      await scope.refresh()

      const rootAfter = di.get(Root)
      const outAfter = di.get(Out)

      expect(root).not.toEqual(rootAfter)
      expect(root.id).not.toEqual(rootAfter.id)
      expect(root.msg()).toEqual('test dev')
      expect(out).toEqual(outAfter)
      expect(out.id).toEqual(outAfter.id)
      expect(out.hi()).toEqual('tchau')
    })
  })
})
