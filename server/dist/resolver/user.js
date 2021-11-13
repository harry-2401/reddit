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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserResolver = void 0;
const type_graphql_1 = require("type-graphql");
const User_1 = require("../entities/User");
const argon2_1 = __importDefault(require("argon2"));
const UserMutationResponse_1 = require("../src/types/UserMutationResponse");
const RegisterInput_1 = require("../src/types/RegisterInput");
const validateRegisterInput_1 = require("../utils/validateRegisterInput");
const LoginInput_1 = require("../src/types/LoginInput");
const constants_1 = require("../src/constants");
let UserResolver = class UserResolver {
    me({ req }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.session.userId) {
                return null;
            }
            const user = yield User_1.User.findOne(req.session.userId);
            return user;
        });
    }
    register(RegisterInput, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const validateRegisterInputErrors = (0, validateRegisterInput_1.validateRegisterInput)(RegisterInput);
            if (validateRegisterInputErrors !== null) {
                return Object.assign({ code: 400, success: false }, validateRegisterInputErrors);
            }
            try {
                const { email, username, password } = RegisterInput;
                const existingUser = yield User_1.User.findOne({
                    where: [{ username }, { email }],
                });
                if (existingUser)
                    return {
                        code: 400,
                        success: false,
                        message: "Duplicate username or email",
                        errors: [
                            {
                                field: existingUser.username === username ? "username" : "email",
                                message: (existingUser.username === username ? "Username" : "Email") +
                                    " already taken",
                            },
                        ],
                    };
                const hasedPassword = yield argon2_1.default.hash(password);
                const newUser = User_1.User.create({
                    username,
                    password: hasedPassword,
                    email,
                });
                const createdUser = yield newUser.save();
                //set cookie
                req.session.userId = createdUser.id;
                return {
                    code: 200,
                    success: true,
                    message: "User registration successfully!",
                    user: createdUser,
                };
            }
            catch (error) {
                return {
                    code: 400,
                    success: false,
                    message: "Internal server error " + error.message,
                };
            }
        });
    }
    login(loginInput, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingUser = yield User_1.User.findOne(loginInput.usernameOrEmail.includes("@")
                    ? { email: loginInput.usernameOrEmail }
                    : { username: loginInput.usernameOrEmail });
                console.log(existingUser);
                if (!existingUser) {
                    return {
                        code: 400,
                        success: false,
                        message: "User not found",
                        errors: [
                            {
                                field: "UsernameOfEmail",
                                message: "Username or email not found",
                            },
                        ],
                    };
                }
                const passwordValid = yield argon2_1.default.verify(existingUser.password, loginInput.password);
                if (!passwordValid) {
                    return {
                        code: 400,
                        success: false,
                        message: "Wrong password",
                        errors: [{ field: "password", message: "Wrong password" }],
                    };
                }
                //sesion: userId = existingUser.id
                //create session and return cookie
                req.session.userId = existingUser.id;
                return {
                    code: 200,
                    success: true,
                    message: "Logged in successfully!",
                    user: existingUser,
                };
            }
            catch (error) {
                console.log(error);
                return {
                    code: 500,
                    success: false,
                    message: "Internal server errors " + error.message,
                };
            }
        });
    }
    logout({ req, res }) {
        return new Promise((resolve, _rejects) => {
            res.clearCookie(constants_1.COOKIE_NAME);
            req.session.destroy((error) => {
                if (error) {
                    console.log(`DESTROYING SESSION ERROR ${error}`);
                    resolve(false);
                }
                resolve(true);
            });
        });
    }
};
__decorate([
    (0, type_graphql_1.Query)(_return => User_1.User, { nullable: true }),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "me", null);
__decorate([
    (0, type_graphql_1.Mutation)((_return) => UserMutationResponse_1.UserMutationResponse),
    __param(0, (0, type_graphql_1.Arg)("registerInput")),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RegisterInput_1.RegisterInput, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "register", null);
__decorate([
    (0, type_graphql_1.Mutation)((_return) => UserMutationResponse_1.UserMutationResponse),
    __param(0, (0, type_graphql_1.Arg)("loginInput")),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LoginInput_1.LoginInput, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "login", null);
__decorate([
    (0, type_graphql_1.Mutation)((_return) => Boolean),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "logout", null);
UserResolver = __decorate([
    (0, type_graphql_1.Resolver)()
], UserResolver);
exports.UserResolver = UserResolver;
