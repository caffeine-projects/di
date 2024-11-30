declare class NestRep {
}
declare class NestSvc {
    readonly repo: NestRep;
    constructor(repo: NestRep);
}
export declare class NestRoot {
    readonly svc: NestSvc;
    constructor(svc: NestSvc);
}
export declare class NestTransientRoot {
    readonly svc: NestSvc;
    constructor(svc: NestSvc);
}
export declare class App {
}
export declare function bootstrap(): Promise<import("@nestjs/common").INestApplicationContext>;
export {};
