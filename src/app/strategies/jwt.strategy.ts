import { UserAccountEntity, userAccountService } from '@/user-account';
import { Environment, EnvVars } from '@/utils';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';

// Passport Strategies

const jwtOptions: StrategyOptions = {
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
	jsonWebTokenOptions: {
		ignoreExpiration: false,
	},
	secretOrKey: Environment.getString(EnvVars.APP_SALT, 'd3f4ul75a1tf0rjw7T0k3n'),
	algorithms: ['HS256'],
};

type JWTPayload = {
	data: UserAccountEntity;
	iat: number;
	exp: number;
};

export const JWTStrategy = new Strategy(jwtOptions, async (jwtPayload: JWTPayload, done) => {
	const { data: user, iat, exp } = jwtPayload;

	const isExpired = exp * 1000 - Date.now() < 0;

	if (isExpired) {
		return done('Token expired', false);
	}

	const account = await userAccountService.findById(user.id);

	if (!account) {
		return done(`User not found <id:${user.id}>`, false);
	}

	// TODO check if account is banned/disabled/not activated

	return done(null, account);
});
