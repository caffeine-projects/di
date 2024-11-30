// reflect-metadata is necessary for the legacy third party implementations
import 'reflect-metadata'

import { barplot, bench } from 'mitata'
import { run } from 'mitata'
import { Root } from './_testdata/di.js'
import { di } from './_testdata/di.js'
import { RootSingleton } from './_testdata/di.js'
import { inv, InvRootSingleton as InvSingletonRoot } from './_testdata/third_party_legacy/dist/inversify.js'
import { InvRoot } from './_testdata/third_party_legacy/dist/inversify.js'
import { tsy, TsySingletonRoot } from './_testdata/third_party_legacy/dist/tsy.js'
import { TsyRoot } from './_testdata/third_party_legacy/dist/tsy.js'
import { bootstrap, NestTransientRoot } from './_testdata/third_party_legacy/dist/nest.js'
import { NestRoot } from './_testdata/third_party_legacy/dist/nest.js'
import { loopCtx, LoopSingletonRoot } from './_testdata/third_party_legacy/dist/loopback.js'
import { LoopRoot } from './_testdata/third_party_legacy/dist/loopback.js'

const nestApp = await bootstrap()

barplot(() => {
  bench('di', () => {
    di.get(Root)
  })

  bench('di singleton', () => {
    di.get(RootSingleton)
  })

  bench('inversify', () => {
    inv.get(InvRoot)
  })

  bench('inversify singleton', () => {
    inv.get(InvSingletonRoot)
  })

  bench('tsyring', () => {
    tsy.resolve(TsyRoot)
  })

  bench('tsyring singleton', () => {
    tsy.resolve(TsySingletonRoot)
  })

  bench('nestjs', async () => {
    await nestApp.resolve(NestTransientRoot)
  })

  bench('nestjs singleton', () => {
    nestApp.get(NestRoot)
  })

  bench('loopback', () => {
    loopCtx.getSync(LoopRoot.name)
  })

  bench('loopback singleton', () => {
    loopCtx.getSync(LoopSingletonRoot.name)
  })
})

await run()
