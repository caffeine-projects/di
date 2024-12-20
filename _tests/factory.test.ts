import { describe, it } from 'node:test'
import { expect } from 'expect'
import { Injectable } from '../decorators/Injectable.js'
import { DI } from '../DI.js'

describe('Factory Provider', function () {
  abstract class Base {
    abstract id: string

    name() {
      return 'base'
    }
  }

  class Repository<T extends Base> {
    constructor(readonly entity: T) {}
  }

  class User extends Base {
    id = 'user-entity'

    name(): string {
      return 'user'
    }
  }

  class Repo {
    constructor(private readonly key?: string) {}

    find() {
      return `test-${this.key ? this.key : 'empty'}`
    }
  }

  @Injectable([Repo])
  class Service {
    constructor(readonly repo: Repo) {}
  }

  it('should allow set factory for unregistered component', function () {
    const di = DI.setup()

    di.bind(Repo).toFactory(() => new Repo())

    const service = di.get(Service)
    const repo = di.get(Repo)

    expect(service.repo.find()).toEqual('test-empty')
    expect(repo.find()).toEqual('test-empty')
  })
})
