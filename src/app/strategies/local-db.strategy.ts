import { UserAccountEntity, userAccountService } from '@/user-account';
import { Strategy as LocalStrategy } from 'passport-local';

export const LocalDBStrategy = new LocalStrategy(async function (username: string, password: string, done: any) {
	try {
		const user: UserAccountEntity =
			(await userAccountService.findByEmail(username)) || (await userAccountService.findByName(username));
		if (!user) {
			return done(null, false, { message: 'Incorrect username.' });
		}
		if (!user.validatePassword(password)) {
			return done(null, false, { message: 'Incorrect password.' });
		}
		return done(null, user);
	} catch (error) {
		return done(error);
	}
});
