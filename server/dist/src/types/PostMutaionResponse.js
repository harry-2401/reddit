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
exports.UserMutationResponse = void 0;
var type_graphql_1 = require("type-graphql");
var Post_1 = require("../../entities/Post");
var FieldError_1 = require("./FieldError");
var MutationResponse_1 = require("./MutationResponse");
var UserMutationResponse = /** @class */ (function () {
    function UserMutationResponse() {
    }
    __decorate([
        (0, type_graphql_1.Field)({ nullable: true }),
        __metadata("design:type", Post_1.Post)
    ], UserMutationResponse.prototype, "post", void 0);
    __decorate([
        (0, type_graphql_1.Field)(function (_type) { return [FieldError_1.FieldError]; }, { nullable: true }),
        __metadata("design:type", Array)
    ], UserMutationResponse.prototype, "errors", void 0);
    UserMutationResponse = __decorate([
        (0, type_graphql_1.ObjectType)({ implements: MutationResponse_1.IMutationResponse })
    ], UserMutationResponse);
    return UserMutationResponse;
}());
exports.UserMutationResponse = UserMutationResponse;
