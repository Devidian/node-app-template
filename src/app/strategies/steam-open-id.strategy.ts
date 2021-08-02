import { UserAccountEntity, userAccountService } from '@/user-account';
import { userAccountRepository } from '@/user-account/repositories/user-account.repository';
import { Environment, EnvVars } from '@/utils';
import { Strategy } from 'passport-steam';

export const SteamOpenIDStrategy = new Strategy(
	{
		returnURL: Environment.getString(EnvVars.OID_STEAM_REDIRECT),
		realm: Environment.getString(EnvVars.OID_REALM),
		apiKey: Environment.getString(EnvVars.OID_STEAM_KEY),
		profile: Environment.getString(EnvVars.OID_STEAM_KEY, '').length > 0,
	},
	async (identifier: string, profile: SteamProfile, done: any) => {
		if (!profile.id) {
			return done(new Error('ERROR.INVALID.STEAM.API.KEY'));
		}
		if (!(await userAccountRepository?.isReady)) {
			return done(new Error('ERROR.DB.NOCOLLECTION'));
		}
		const user: UserAccountEntity | null = await userAccountService.findBySteamIdentifier(identifier);
		if (!user) {
			try {
				let { id, displayName, photos } = profile;
				let nameCheck: UserAccountEntity = await userAccountService.findByName(displayName);
				// to prevent duplicate names we look for a name with suffix #0000 - #9999 that is free
				// in the future we may implement a form of tag like discord has but meanwhile we could just hide the suffix in the frontend if it exists
				while (nameCheck) {
					const alternativeName =
						displayName +
						'#' +
						Math.floor(Math.random() * 9999)
							.toString()
							.padStart(4, '0');
					nameCheck = await userAccountService.findByName(alternativeName);
					if (!nameCheck) {
						displayName = alternativeName;
					}
				}
				const account: Partial<UserAccountEntity> = {
					name: displayName,
					steam: { identifier, id, displayName: profile.displayName, photos, connectedOn: new Date() },
				};

				const u = await userAccountService.create(account);
				return done(null, u);
			} catch (error) {
				return done(error);
			}
		}
		return done(null, user);
	},
);
