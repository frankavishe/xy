"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfStatus = void 0;
const graphql_1 = require("@nestjs/graphql");
var PdfStatus;
(function (PdfStatus) {
    PdfStatus["PENDING"] = "PENDING";
    PdfStatus["READY"] = "READY";
    PdfStatus["EXPIRED"] = "EXPIRED";
    PdfStatus["NOT_FOUND"] = "NOT_FOUND";
})(PdfStatus || (exports.PdfStatus = PdfStatus = {}));
(0, graphql_1.registerEnumType)(PdfStatus, {
    name: 'PdfStatus',
    description: 'Processing state of the server-side compiled session PDF.',
});
//# sourceMappingURL=pdf-status.enum.js.map