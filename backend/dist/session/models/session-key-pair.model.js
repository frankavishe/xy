"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionKeyPair = void 0;
const graphql_1 = require("@nestjs/graphql");
let SessionKeyPair = class SessionKeyPair {
};
exports.SessionKeyPair = SessionKeyPair;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], SessionKeyPair.prototype, "roomId", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { description: '12-character uppercase alphanumeric access hash' }),
    __metadata("design:type", String)
], SessionKeyPair.prototype, "hash", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float, { description: 'Unix ms timestamp at which the unclaimed room expires' }),
    __metadata("design:type", Number)
], SessionKeyPair.prototype, "expiresAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], SessionKeyPair.prototype, "ttlSeconds", void 0);
exports.SessionKeyPair = SessionKeyPair = __decorate([
    (0, graphql_1.ObjectType)()
], SessionKeyPair);
//# sourceMappingURL=session-key-pair.model.js.map