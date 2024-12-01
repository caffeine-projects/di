import { bench, group } from 'mitata'
import { B } from 'mitata'
import { run } from 'mitata'
import { barplot } from 'mitata'
import { Injectable } from '../decorators/Injectable'
import { Configuration } from '../decorators/Configuration'
import { Bean } from '../decorators/Bean'
import { Named } from '../decorators/Named'
import { Primary } from '../decorators/Primary'
import { ConditionalOn } from '../decorators/ConditionalOn'
import { injectAll } from '../injections/injections'
import { optional } from '../injections/injections'
import { DI } from '../DI'
import { Transient } from '../decorators/Transient'
import { Inject } from '../decorators/Inject'

function makeBench(name: string, fn: () => any): B {
  return bench(name, fn).gc('inner').baseline(true).compact(true)
}

const kDbURL = Symbol('db_url')

@Configuration()
class DbConf {
  @Bean(kDbURL)
  dbURL(): string {
    return 'test_db'
  }
}

@Injectable([kDbURL])
class Db {
  constructor(readonly dbURL: string) {}
}

interface Repo {
  fetch(): string
}

@Injectable([Db])
class RepoDb implements Repo {
  constructor(readonly db: Db) {}

  fetch(): string {
    return this.db.dbURL
  }
}

interface Notification {
  send(): void
}

const kNotification = Symbol('notification')

@Injectable(kNotification)
@Primary()
class EmailNotification implements Notification {
  send(): void {}
}

@Injectable(kNotification)
class SmsNotification implements Notification {
  send(): void {}
}

abstract class Act {
  abstract act(): void
}

@Injectable()
class Act1 extends Act {
  act(): void {}
}

@Injectable()
@ConditionalOn(() => false)
class Maybe {}

const kLog = Symbol('log')

interface Logger {
  info(): void
}

@Injectable()
@Named(kLog)
class TxtLogger implements Logger {
  info(): void {}
}

@Injectable()
@Named(kLog)
class StdLogger implements Logger {
  info(): void {}
}

@Injectable()
@Named(kLog)
class JSONLogger implements Logger {
  info(): void {}
}

@Injectable()
class Simple {}

@Injectable([RepoDb, kNotification, Act, injectAll(kLog), optional(Maybe)])
class Root {
  constructor(
    readonly repo: Repo,
    readonly notification: Notification,
    readonly act: Act,
    readonly loggers: Logger[],
    readonly maybe?: Maybe,
  ) {}
}

@Injectable([Act, injectAll(kLog), optional(Maybe)])
class RootWithMethodInjection {
  repo!: Repo
  notification!: Notification

  constructor(
    readonly act: Act,
    readonly loggers: Logger[],
    readonly maybe?: Maybe,
  ) {}

  @Inject([RepoDb, kNotification])
  setDeps(repo: Repo, notification: Notification) {
    this.repo = repo
    this.notification = notification
  }
}

@Injectable([Act, injectAll(kLog), optional(Maybe)])
class RootWithAll {
  repo!: Repo

  @Inject(kNotification)
  notification!: Notification

  constructor(
    readonly act: Act,
    readonly loggers: Logger[],
    readonly maybe?: Maybe,
  ) {}

  @Inject([RepoDb])
  setDeps(repo: Repo) {
    this.repo = repo
  }
}

@Injectable([RepoDb, kNotification, Act, injectAll(kLog), optional(Maybe)])
@Transient()
class RootTransient {
  constructor(
    readonly repo: Repo,
    readonly notification: Notification,
    readonly act: Act,
    readonly loggers: Logger[],
    readonly maybe?: Maybe,
  ) {}
}

@Injectable([RepoDb, Act, injectAll(kLog), optional(Maybe)])
class RootWithProps {
  @Inject(kNotification)
  notification!: Notification

  constructor(
    readonly repo: Repo,
    readonly act: Act,
    readonly loggers: Logger[],
    readonly maybe?: Maybe,
  ) {}
}

@Injectable([Act, injectAll(kLog), optional(Maybe)])
class RootWith2Props {
  @Inject(kNotification)
  notification!: Notification

  @Inject(RepoDb)
  repo!: Repo

  constructor(
    readonly act: Act,
    readonly loggers: Logger[],
    readonly maybe?: Maybe,
  ) {}
}

const di = DI.setup()

barplot(() => {
  group('resolutions', () => {
    makeBench('class simple', () => {
      di.get(Simple)
    })

    makeBench('class ctor deps', () => {
      di.get(Root)
    })

    makeBench('class ctor deps tr', () => {
      di.get(RootTransient)
    })

    makeBench('class ctor props', () => {
      di.get(RootWithProps)
    })

    makeBench('class ctor 2 props', () => {
      di.get(RootWith2Props)
    })

    makeBench('class ctor method', () => {
      di.get(RootWithMethodInjection)
    })

    makeBench('class ctor method props', () => {
      di.get(RootWithAll)
    })

    makeBench('many', () => {
      di.getMany(kLog)
    })

    makeBench('optional', () => {
      di.get(Maybe)
    })

    makeBench('abstract', () => {
      di.get(Act)
    })

    makeBench('primary', () => {
      di.get(kNotification)
    })

    makeBench('bean - string value', () => {
      di.get(kDbURL)
    })
  })
})

await run()
