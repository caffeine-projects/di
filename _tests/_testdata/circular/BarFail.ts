import { Injectable } from '../../../decorators/Injectable.js'
import { TypeOf } from '../../../TypeOf.js'
import { FooFail } from './FooFail.js'

@Injectable([FooFail])
export class BarFail {
  constructor(readonly foo: TypeOf<FooFail>) {}

  id = () => 'bar'

  test(): string {
    return `bar-${this.foo.id()}`
  }
}
