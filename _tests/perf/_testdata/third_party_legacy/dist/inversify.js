var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { injectable } from 'inversify';
import { Container } from 'inversify';
let InvRep = class InvRep {
};
InvRep = __decorate([
    injectable()
], InvRep);
let InvSvc = class InvSvc {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
};
InvSvc = __decorate([
    injectable(),
    __metadata("design:paramtypes", [InvRep])
], InvSvc);
let InvRoot = class InvRoot {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
};
InvRoot = __decorate([
    injectable(),
    __metadata("design:paramtypes", [InvSvc])
], InvRoot);
export { InvRoot };
let InvRootSingleton = class InvRootSingleton {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
};
InvRootSingleton = __decorate([
    injectable(),
    __metadata("design:paramtypes", [InvSvc])
], InvRootSingleton);
export { InvRootSingleton };
const inv = new Container();
inv.bind(InvRep).toSelf();
inv.bind(InvSvc).toSelf();
inv.bind(InvRoot).toSelf();
inv.bind(InvRootSingleton).toSelf().inSingletonScope();
export { inv };
