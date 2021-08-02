import express = require('express');
import { UserAccountEntity, userAccountService } from '@/user-account';
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
	const plain = user.toPlain(['owner']);

	const token = sign({ data: plain }, Environment.getString(EnvVars.APP_SALT, 'd3f4ul75a1tf0rjw7T0k3n'), {
		expiresIn: '7d',
	});
	res.setHeader('x-refresh-token', token);
	res
		.send({
			user: user.toPlain(['owner']),
			token,
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
	const user: UserAccountEntity = req.user as UserAccountEntity;
	const plain = user.toPlain(['owner']);

	// Successful authentication, redirect home.
	const jwt = sign({ data: plain }, Environment.getString(EnvVars.APP_SALT, 'd3f4ul75a1tf0rjw7T0k3n'), {
		expiresIn: '60s',
	});
	res.redirect(Environment.getString(EnvVars.OID_STEAM_RETURN, '') + `?jwt=${jwt}`);
});

export const authRouter = app;
