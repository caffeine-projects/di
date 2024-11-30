import { DI } from '../../../DI.js'
import { Injectable } from '../../../decorators/Injectable.js'
import { Transient } from '../../../decorators/Transient.js'

@Injectable()
@Transient()
export class Rep1 {}

@Injectable()
@Transient()
export class Rep2 {}

@Injectable()
@Transient()
export class Rep3 {}

@Injectable([Rep1, Rep2, Rep3])
@Transient()
export class Svc1 {
  constructor(
    readonly repo1: Rep1,
    readonly repo2: Rep2,
    readonly rep3: Rep3,
  ) {}
}

@Injectable()
@Transient()
export class Svc2 {}

@Injectable()
@Transient()
export class Svc3 {}

@Injectable()
@Transient()
export class Svc4 {}

@Injectable()
@Transient()
export class Svc5 {}

@Injectable()
@Transient()
export class Svc6 {}

@Injectable([Svc1, Svc2, Svc3, Svc4, Svc5, Svc6])
@Transient()
export class Root {
  constructor(
    readonly svc1: Svc1,
    readonly svc2: Svc2,
    readonly svc3: Svc3,
    readonly svc4: Svc4,
    readonly svc5: Svc5,
    readonly svc6: Svc6,
  ) {}
}

@Injectable([Svc1, Svc2, Svc3, Svc4, Svc5, Svc6])
export class RootSingleton {
  constructor(
    readonly svc1: Svc1,
    readonly svc2: Svc2,
    readonly svc3: Svc3,
    readonly svc4: Svc4,
    readonly svc5: Svc5,
    readonly svc6: Svc6,
  ) {}
}

const di = DI.setup()

export { di }
