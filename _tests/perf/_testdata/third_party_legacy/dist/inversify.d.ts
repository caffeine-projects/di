declare class InvRep {
}
declare class InvSvc {
    readonly repo: InvRep;
    constructor(repo: InvRep);
}
export declare class InvRoot {
    readonly svc: InvSvc;
    constructor(svc: InvSvc);
}
export declare class InvRootSingleton {
    readonly svc: InvSvc;
    constructor(svc: InvSvc);
}
declare const inv: any;
export { inv };
