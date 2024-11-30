var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, Scope } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
let NestRep = class NestRep {
};
NestRep = __decorate([
    Injectable()
], NestRep);
let NestSvc = class NestSvc {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
};
NestSvc = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [NestRep])
], NestSvc);
let NestRoot = class NestRoot {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
};
NestRoot = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [NestSvc])
], NestRoot);
export { NestRoot };
let NestTransientRoot = class NestTransientRoot {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
};
NestTransientRoot = __decorate([
    Injectable({ scope: Scope.TRANSIENT }),
    __metadata("design:paramtypes", [NestSvc])
], NestTransientRoot);
export { NestTransientRoot };
let App = class App {
};
App = __decorate([
    Module({
        providers: [NestRep, NestSvc, NestRoot, NestTransientRoot],
    })
], App);
export { App };
export async function bootstrap() {
    return await NestFactory.createApplicationContext(App, { logger: false });
}
