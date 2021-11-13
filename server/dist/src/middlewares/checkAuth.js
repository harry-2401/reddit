"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAuth = void 0;
const apollo_server_errors_1 = require("apollo-server-errors");
const checkAuth = ({ context }, next) => {
    if (!context.req.session.userId) {
        throw new apollo_server_errors_1.AuthenticationError("Not authenticated to perform GraphQL operations");
    }
    return next();
};
exports.checkAuth = checkAuth;
