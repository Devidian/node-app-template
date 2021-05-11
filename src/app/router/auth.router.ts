import express = require('express');
import { UserAccountEntity, userAccountService } from '@/user-account';
import { accountController } from '@/user-account/controllers/user-account.controller';
import { Environment, EnvVars } from '@/utils';
import { RequestHandler } from 'express';
import { sign } from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { authGuard } from '../guards/auth.guard';
import { JWTStrategy } from '../strategies/jwt.strategy';
import { LocalDBStrategy } from '../strategies/local-db.strategy';
import { SteamOpenIDStrategy } from '../strategies/steam-open-id.strategy';
import passport = require('passport');

const app = express();
app.disable('x-powered-by');

passport.serializeUser((user: any, done) => {
	done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
	try {
		if (!ObjectId.isValid(id)) {
			return done(new Error('Invalid ObjectId'));
		}
		const user: UserAccountEntity | null | undefined = await userAccountService.findById(id);
		return done(null, user);
	} catch (error) {
		done(error);
	}
});

passport.use(LocalDBStrategy);
passport.use(SteamOpenIDStrategy);
passport.use(JWTStrategy);

const sendAccountHandler: RequestHandler = (req, res) => {
	const user: UserAccountEntity = req.user as UserAccountEntity;
	res
		.send({
			user: user.plain(true),
			token: sign({ data: user.plain(false) }, Environment.getString(EnvVars.APP_SALT), { expiresIn: '7d' }),
		})
		.end();
};

app.post('/login', passport.authenticate(['jwt', 'local']), sendAccountHandler);

app.post('/generatetoken', authGuard, sendAccountHandler);

app.get('/logout', (req, res) => {
	req.logout();
	res.send({ success: true }).end();
});

app.get('/steam', passport.authenticate('steam'));

app.get('/steam/return', passport.authenticate('steam'), (req, res) => {
	// Successful authentication, redirect home.
	res.redirect(Environment.getString(EnvVars.OID_STEAM_RETURN, ''));
});

export const authRouter = app;
