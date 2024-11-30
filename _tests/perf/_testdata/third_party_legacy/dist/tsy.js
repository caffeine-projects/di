var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { injectable, singleton } from 'tsyringe';
import { container as tsy } from 'tsyringe';
let TsyRep = class TsyRep {
};
TsyRep = __decorate([
    injectable()
], TsyRep);
let TsySvc = class TsySvc {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
};
TsySvc = __decorate([
    injectable(),
    __metadata("design:paramtypes", [TsyRep])
], TsySvc);
let TsyRoot = class TsyRoot {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
};
TsyRoot = __decorate([
    injectable(),
    __metadata("design:paramtypes", [TsySvc])
], TsyRoot);
export { TsyRoot };
let TsySingletonRoot = class TsySingletonRoot {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
};
TsySingletonRoot = __decorate([
    singleton(),
    __metadata("design:paramtypes", [TsySvc])
], TsySingletonRoot);
export { TsySingletonRoot };
export { tsy };
