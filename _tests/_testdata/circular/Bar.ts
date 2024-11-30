import { v4 } from 'uuid'
import { Injectable } from '../../../decorators/Injectable.js'
import { Scoped } from '../../../decorators/Scoped.js'
import { TypeOf } from '../../../TypeOf.js'
import { Lifecycle } from '../../../Lifecycle.js'
import { Foo } from './Foo.js'
import { deps } from '../../../injections/injections.js'

@Injectable([deps.defer(() => Foo)])
@Scoped(Lifecycle.TRANSIENT)
export class Bar {
  uuid: string = v4()

  constructor(readonly foo: TypeOf<Foo>) {}

  id = () => 'bar'

  test(): string {
    return `bar-${this.foo.id()}`
  }
}
