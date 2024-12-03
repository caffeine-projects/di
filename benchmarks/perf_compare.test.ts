// reflect-metadata is necessary for the legacy third party implementations
import 'reflect-metadata'

import { performance } from 'node:perf_hooks'
import { describe, it } from 'node:test'
import { expect } from 'expect'
import { green, yellow } from 'colorette'
import { Root } from './_testdata/di'
import { di } from './_testdata/di'
import { RootSingleton } from './_testdata/di'
import { inv, InvRootSingleton as InvSingletonRoot } from './_testdata/third_party_legacy/dist/inversify'
import { InvRoot } from './_testdata/third_party_legacy/dist/inversify'
import { tsy, TsySingletonRoot } from './_testdata/third_party_legacy/dist/tsy'
import { TsyRoot } from './_testdata/third_party_legacy/dist/tsy'
import { bootstrap, NestTransientRoot } from './_testdata/third_party_legacy/dist/nest'
import { NestRoot } from './_testdata/third_party_legacy/dist/nest'
import { loopCtx, LoopSingletonRoot } from './_testdata/third_party_legacy/dist/loopback'
import { LoopRoot } from './_testdata/third_party_legacy/dist/loopback'
import { table } from 'table'

const failIfLess = process.env.TEST_FAIL_PERF === 'true'
const iterations = 15000
const items = new Array<{ pos: number; total: number }>(iterations)
const diff = (a: number, b: number): number => Math.round(((a - b) / b) * 100)

describe('Performance Comparison', function () {
  interface Results {
    avg: number
    max: number
    min: number
    items: Array<{ pos: number; total: number }>
  }

  function resolve(times: number, res: () => unknown): Results {
    const result = {
      avg: -1,
      max: -1,
      min: Number.MAX_SAFE_INTEGER,
      items: items,
    }

    let i: number

    for (i = 0; i < times; i++) {
      const start = performance.now()

      res()

      const end = performance.now()
      const total = end - start

      if (total < result.min) {
        result.min = total
      }

      if (total > result.max) {
        result.max = total
      }

      result.items[i] = { pos: i, total }
    }

    result.avg = result.items.reduce((p, c) => p + c.total, 0) / result.items.length
    result.items.sort((a, b) => b.total - a.total)

    return result
  }

  async function resolveAsync(times: number, res: () => Promise<unknown>) {
    const result = {
      avg: -1,
      max: -1,
      min: Number.MAX_SAFE_INTEGER,
      items: items,
    }

    let i: number

    for (i = 0; i < times; i++) {
      const start = performance.now()

      await res()

      const end = performance.now()
      const total = end - start

      if (total < result.min) {
        result.min = total
      }
      if (total > result.max) {
        result.max = total
      }

      result.items[i] = { pos: i, total }
    }

    result.avg = result.items.reduce((p, c) => p + c.total, 0) / result.items.length
    result.items.sort((a, b) => b.total - a.total)

    return result
  }

  it(`should resolve ${iterations} times in less time then the others`, async () => {
    const results: any[][] = [['Lib', 'Avg', 'Diff']]
    const resultsSingleton: any[][] = [['Lib', 'Avg', 'Diff']]
    const resultsAsync: any[][] = [['Lib', 'Avg', 'Diff']]

    // setup
    const nestApp = await bootstrap()

    // ensuring everything was correctly configured
    expect(inv.get(InvRoot)).toBeInstanceOf(InvRoot)
    expect(inv.get(InvSingletonRoot)).toBeInstanceOf(InvSingletonRoot)
    expect(tsy.resolve(TsyRoot)).toBeInstanceOf(TsyRoot)
    expect(tsy.resolve(TsySingletonRoot)).toBeInstanceOf(TsySingletonRoot)
    expect(loopCtx.getSync(LoopRoot.name)).toBeInstanceOf(LoopRoot)
    expect(di.get(Root)).toBeInstanceOf(Root)

    const invRes = resolve(iterations, () => inv.get(InvRoot))
    const invSingletonRes = resolve(iterations, () => inv.get(InvSingletonRoot))
    const tsyRes = resolve(iterations, () => tsy.resolve(TsyRoot))
    const tsySingletonRes = resolve(iterations, () => tsy.resolve(TsySingletonRoot))
    const diRes = resolve(iterations, () => di.get(Root))
    const diSingletonRes = resolve(iterations, () => di.get(RootSingleton))
    const nestRes = await resolveAsync(iterations, () => nestApp.resolve(NestTransientRoot))
    const nestSingletonRes = resolve(iterations, () => nestApp.get(NestRoot))
    const nestAsyncRes = await resolveAsync(iterations, () => nestApp.resolve(NestTransientRoot))
    const nestAsyncSingletonRes = await resolveAsync(iterations, () => nestApp.resolve(NestRoot))
    const loopRes = resolve(iterations, () => loopCtx.getSync(LoopRoot.name))
    const loopSingletonRes = resolve(iterations, () => loopCtx.getSync(LoopSingletonRoot.name))

    // async runs
    const diAsync = await resolveAsync(iterations, () => di.getAsync(Root))
    const diAsyncSingleton = await resolveAsync(iterations, () => di.getAsync(RootSingleton))

    // printing results
    results.push(['DI', diRes.avg, '-'])
    resultsSingleton.push(['DI Singleton', diSingletonRes.avg, '-'])
    resultsAsync.push(['DI Async', diAsync.avg, '-'])
    resultsAsync.push(['DI Async Singleton', diAsyncSingleton.avg, '-'])

    function addResult(name: string, arr: any[][], base: Results, target: Results) {
      let df = String(diff(base.avg, target.avg)) + '%'

      if (base.avg > target.avg) {
        df = yellow(df)
      } else {
        df = green(df)
      }

      arr.push([name, target.avg, df])
    }

    addResult('Inversify', results, diRes, invRes)
    addResult('Inversify Singleton', resultsSingleton, diSingletonRes, invSingletonRes)
    addResult('Tsyringe', results, diRes, tsyRes)
    addResult('Tsyringe Singleton', resultsSingleton, diSingletonRes, tsySingletonRes)
    addResult('Loopback', results, diRes, loopRes)
    addResult('Loopback Singleton', resultsSingleton, diSingletonRes, loopSingletonRes)
    addResult('Nestjs', results, diRes, nestRes)
    addResult('Nestjs Singleton', resultsSingleton, diSingletonRes, nestSingletonRes)
    addResult('Nestjs Async', resultsAsync, diAsync, nestAsyncRes)
    addResult('Nestjs Async Singleton', resultsAsync, diAsyncSingleton, nestAsyncSingletonRes)

    console.log(
      table(
        results.sort((a, b) => a[1] - b[1]),
        { header: { content: 'Perf' } },
      ),
    )

    console.log(
      table(
        resultsSingleton.sort((a, b) => a[1] - b[1]),
        { header: { content: 'Perf - Singleton' } },
      ),
    )

    console.log(
      table(
        resultsAsync.sort((a, b) => a[1] - b[1]),
        { header: { content: 'Perf - Async' } },
      ),
    )

    if (failIfLess) {
      expect(diRes.avg).toBeLessThan(invRes.avg)
      expect(diSingletonRes.avg).toBeLessThan(invSingletonRes.avg)

      expect(diRes.avg).toBeLessThan(loopRes.avg)
      expect(diSingletonRes.avg).toBeLessThan(loopSingletonRes.avg)

      expect(diRes.avg).toBeLessThan(tsyRes.avg)
      expect(diSingletonRes.avg).toBeLessThan(tsySingletonRes.avg)

      expect(diRes.avg).toBeLessThan(nestAsyncRes.avg)
      expect(diSingletonRes.avg).toBeLessThan(nestSingletonRes.avg)
    }
  })
})
