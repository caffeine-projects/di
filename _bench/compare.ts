import 'reflect-metadata'
import cronometro from 'cronometro'
import { printResults } from './printResults.js'
import { errorThreshold } from './vars.js'
import { connections } from './vars.js'
import { TsyRoot } from './_testdata/tsyringe.js'
import { TsyTransientRoot } from './_testdata/tsyringe.js'
import { tsyringeContainer } from './_testdata/tsyringe.js'
import { inversifyContainer } from './_testdata/inversify.js'
import { InvRoot } from './_testdata/inversify.js'
import { InvTransientRoot } from './_testdata/inversify.js'
import { di } from './_testdata/di.js'
import { CafRoot } from './_testdata/di.js'
import { CafTransientRoot } from './_testdata/di.js'
import { bootstrap } from './_testdata/nestjs.js'
import { NestRoot } from './_testdata/nestjs.js'
import { NestTransientRoot } from './_testdata/nestjs.js'
import { loopCtx } from './_testdata/loopback.js'
import { LoopRoot } from './_testdata/loopback.js'
import { LoopTransientRoot } from './_testdata/loopback.js'

const nestApp = await bootstrap()

cronometro(
  {
    tsyringe() {
      tsyringeContainer.resolve(TsyRoot)
      tsyringeContainer.resolve(TsyTransientRoot)
    },

    inversify() {
      inversifyContainer.get(InvRoot)
      inversifyContainer.get(InvTransientRoot)
    },

    di() {
      di.get(CafRoot)
      di.get(CafTransientRoot)
    },

    loopBack() {
      loopCtx.getSync(LoopRoot.name)
      loopCtx.getSync(LoopTransientRoot.name)
    },

    nestjs() {
      nestApp.get(NestRoot)
      return nestApp.resolve(NestTransientRoot)
    },
  },
  {
    iterations: 5000,
    errorThreshold,
  },
  async (err, results) => {
    if (err) {
      throw err
    }

    console.log(printResults(connections, results))

    await nestApp.close()
  },
)
