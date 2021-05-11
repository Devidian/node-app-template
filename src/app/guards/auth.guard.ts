import { RequestHandler } from "express";

export const authGuard: RequestHandler = (req, res, next) => {
    if (req.isUnauthenticated()) {
        res.status(401).send({ error: "Unauthorized, please login", i18n: "API.ACCOUNT.UNAUTHORIZED" }).end();
    } else {
        next();
    }
}