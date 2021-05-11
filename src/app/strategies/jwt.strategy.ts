import { Environment, EnvVars } from '@/utils';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';

// Passport Strategies

const jwtOptions: StrategyOptions = {
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
	secretOrKey: Environment.getString(EnvVars.APP_SALT, 'd3f4ul75a1tf0rjw7T0k3n'),
};

export const JWTStrategy = new Strategy(jwtOptions, async function (jwtPayload, done) {
	console.log(jwtPayload);
	done(null, false);
});
