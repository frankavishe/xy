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
exports.TranscriptLine = void 0;
const graphql_1 = require("@nestjs/graphql");
let TranscriptLine = class TranscriptLine {
};
exports.TranscriptLine = TranscriptLine;
__decorate([
    (0, graphql_1.Field)(() => String, { description: '"Caller" or "Receiver"' }),
    __metadata("design:type", String)
], TranscriptLine.prototype, "speakerId", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float, { description: 'Unix millisecond timestamp' }),
    __metadata("design:type", Number)
], TranscriptLine.prototype, "timestamp", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], TranscriptLine.prototype, "textSegment", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    __metadata("design:type", Boolean)
], TranscriptLine.prototype, "isFinal", void 0);
exports.TranscriptLine = TranscriptLine = __decorate([
    (0, graphql_1.ObjectType)()
], TranscriptLine);
//# sourceMappingURL=transcript-line.model.js.map