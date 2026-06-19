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
exports.PdfStatusResult = void 0;
const graphql_1 = require("@nestjs/graphql");
const pdf_status_enum_1 = require("../enums/pdf-status.enum");
let PdfStatusResult = class PdfStatusResult {
};
exports.PdfStatusResult = PdfStatusResult;
__decorate([
    (0, graphql_1.Field)(() => pdf_status_enum_1.PdfStatus),
    __metadata("design:type", String)
], PdfStatusResult.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    __metadata("design:type", String)
], PdfStatusResult.prototype, "downloadUrl", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int, { nullable: true }),
    __metadata("design:type", Number)
], PdfStatusResult.prototype, "wordCount", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int, { nullable: true }),
    __metadata("design:type", Number)
], PdfStatusResult.prototype, "durationSeconds", void 0);
exports.PdfStatusResult = PdfStatusResult = __decorate([
    (0, graphql_1.ObjectType)()
], PdfStatusResult);
//# sourceMappingURL=pdf-status-result.model.js.map