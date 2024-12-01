// reflect-metadata is necessary for the legacy third party implementations
import 'reflect-metadata'

import { barplot, bench, group } from 'mitata'
import { run } from 'mitata'
import { B } from 'mitata'
import { Root } from './_testdata/di'
import { di } from './_testdata/di'
import { RootSingleton } from './_testdata/di'
import { Rep1 } from './_testdata/di'
import { Svc1 } from './_testdata/di'
import { Rep3 } from './_testdata/di'
import { Rep2 } from './_testdata/di'
import { Svc2 } from './_testdata/di'
import { Svc3 } from './_testdata/di'
import { Svc4 } from './_testdata/di'
import { Svc5 } from './_testdata/di'
import { Svc6 } from './_testdata/di'
import { inv, InvRootSingleton as InvSingletonRoot } from './_testdata/third_party_legacy/inversify'
import { InvRoot } from './_testdata/third_party_legacy/inversify'
import { tsy, TsySingletonRoot } from './_testdata/third_party_legacy/tsy'
import { TsyRoot } from './_testdata/third_party_legacy/tsy'
import { bootstrap, NestTransientRoot } from './_testdata/third_party_legacy/nest'
import { NestRoot } from './_testdata/third_party_legacy/nest'
import { loopCtx, LoopSingletonRoot } from './_testdata/third_party_legacy/loopback'
import { LoopRoot } from './_testdata/third_party_legacy/loopback'

function makeBench(name: string, fn: () => any): B {
  return bench(name, fn).gc('inner').baseline(true).compact(true)
}

const nestApp = await bootstrap()

barplot(() => {
  group('normal', () => {
    makeBench('raw', () => {
      new Root(new Svc1(new Rep1(), new Rep2(), new Rep3()), new Svc2(), new Svc3(), new Svc4(), new Svc5(), new Svc6())
    })

    makeBench('di', () => {
      di.get(Root)
    })

    makeBench('di singleton', () => {
      di.get(RootSingleton)
    })

    makeBench('inversify', () => {
      inv.get(InvRoot)
    })

    makeBench('inversify singleton', () => {
      inv.get(InvSingletonRoot)
    })

    makeBench('tsyring', () => {
      tsy.resolve(TsyRoot)
    })

    makeBench('tsyring singleton', () => {
      tsy.resolve(TsySingletonRoot)
    })

    makeBench('nestjs singleton', () => {
      nestApp.get(NestRoot)
    })

    makeBench('loopback', () => {
      loopCtx.getSync(LoopRoot.name)
    })

    makeBench('loopback singleton', () => {
      loopCtx.getSync(LoopSingletonRoot.name)
    })
  })

  group('async', () => {
    makeBench('di', async () => {
      await di.getAsync(Root)
    })

    makeBench('nestjs', async () => {
      await nestApp.resolve(NestTransientRoot)
    })
  })

  group('async - singleton', () => {
    makeBench('di', async () => {
      await di.getAsync(RootSingleton)
    })

    makeBench('nestjs', async () => {
      await nestApp.resolve(NestRoot)
    })
  })
})

await run()
