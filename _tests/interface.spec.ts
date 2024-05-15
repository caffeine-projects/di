import { describe, it } from '@jest/globals'
import { Injectable } from '../decorators/Injectable.js'
import { DI } from '../DI.js'
import { NoResolutionForTokenError } from '../internal/errors.js'
import { Inject } from '../decorators/Inject.js'
import { v4 } from 'uuid'

describe('interfaces', function () {
  describe('given an interface with multiple implementations and one of them using a named token', function () {
    const kRepo = Symbol('repo')

    interface Repository {
      save(): string
    }

    @Injectable()
    class InMemoryRepository implements Repository {
      save(): string {
        return 'in-memory'
      }
    }

    @Injectable(kRepo)
    class MySQLRepository implements Repository {
      readonly id: string = v4()

      save(): string {
        return 'mysql'
      }
    }

    it('should fail when the dependency does not have the correct token', function () {
      @Injectable()
      class Service {
        constructor(readonly repo: Repository) {}

        act(): string {
          return this.repo.save()
        }
      }

      const di = DI.setup()

      expect(() => di.getRequired(Service)).toThrow(NoResolutionForTokenError)
    })

    it('should resolve the dependency when it is correctly identified', function () {
      @Injectable()
      class Service {
        constructor(@Inject(kRepo) readonly repo: Repository) {}

        act(): string {
          return this.repo.save()
        }
      }

      const di = DI.setup()

      for (let i = 0; i < 5000; i++) {
        const svc1 = di.getRequired(Service)
        const svc2 = di.getRequired(Service)

        expect(svc1.act()).toStrictEqual('mysql')
        expect(svc2.act()).toStrictEqual('mysql')
        expect(svc1).toEqual(svc2)
        expect((svc1.repo as MySQLRepository).id).toEqual((svc2.repo as MySQLRepository).id)
      }
    })
  })
})
