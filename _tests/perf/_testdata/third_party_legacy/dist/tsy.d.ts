import { container as tsy } from 'tsyringe';
declare class TsyRep {
}
declare class TsySvc {
    readonly repo: TsyRep;
    constructor(repo: TsyRep);
}
export declare class TsyRoot {
    readonly svc: TsySvc;
    constructor(svc: TsySvc);
}
export declare class TsySingletonRoot {
    readonly svc: TsySvc;
    constructor(svc: TsySvc);
}
export { tsy };
