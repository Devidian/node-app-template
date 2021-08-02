import { AppInfo, EntityFactory, Environment, ExtendedLogger, sendEmail } from '@/utils';
import { validate } from 'class-validator';
import { readFileSync } from 'fs';
import { UserAccountEntity } from '../entities/user-account.entity';
import { userAccountRepository } from '../repositories/user-account.repository';

class UserAccountService {
	protected repo = userAccountRepository;
	protected logger = new ExtendedLogger(UserAccountService.name);

	public getAll(): Promise<UserAccountEntity[]> {
		return this.repo.getAll();
	}

	public findByExternalId(id: string, idType: ExternalIdType): Promise<UserAccountEntity> {
		switch (idType) {
			case 'steam64':
				return this.findBySteamId(id);
			default:
				return null;
		}
	}

	public findBySteamIdentifier(identifier: string): UserAccountEntity | PromiseLike<UserAccountEntity> {
		return this.repo.findBySteamIdentifier(identifier);
	}

	public findByName(name: string): UserAccountEntity | PromiseLike<UserAccountEntity> {
		return this.repo.findByName(name);
	}

	public findBySteamId(id: string): Promise<UserAccountEntity> {
		return this.repo.findItemBySteamId(id);
	}

	public findById(id: string): Promise<UserAccountEntity> {
		return this.repo.findItemById(id);
	}

	public findByIdList(idList: string[]): Promise<UserAccountEntity[]> {
		return this.repo.findItemsByIds(idList);
	}

	public findByEmail(email: string): Promise<UserAccountEntity> {
		return this.repo.findItemByEmail(email);
	}

	public updateAccount(userAccount: UserAccountEntity, data: Partial<UserAccountEntity>): Promise<UserAccountEntity> {
		userAccount.name = data.name;
		userAccount.country = data.country;
		userAccount.email = data.email;

		return this.repo.save(userAccount);
	}

	public verifyEmail(user: UserAccountEntity, token: string) {
		const emailVerification = user.verification.find((v) => v.field == 'email');
		if (!emailVerification) {
			throw new Error('.TOKEN.NOTFOUND');
		}
		if (!emailVerification.tokenValidUntil) {
			throw new Error('.TOKEN.INVALID');
		} else if (emailVerification?.tokenValidUntil?.getTime() < Date.now()) {
		}
		if (!(emailVerification.token == token)) {
			throw new Error('.TOKEN.UNEQUAL');
		} else {
			emailVerification.verifiedOn = new Date();
			delete emailVerification.token;
			delete emailVerification.tokenValidUntil;
			this.repo.save(user);
		}
	}

	public async createEmailVerification(user: UserAccountEntity) {
		try {
			if (!user.email) return this;
			user.createVerificationToken('email');
			// TEST send 'verification-email'
			let body = readFileSync(AppInfo.cwd() + '/assets/templates/email.verification.html', {
				encoding: 'utf-8',
			}).replace('{{PH_TEST}}', 'Welcome');
			await sendEmail(
				Environment.getString('MAIL_FROM', 'readonly@example.com'),
				user.email,
				Environment.getString('MAIL_SUBJECT_VERIFICATION') || 'Email verification',
				body,
				'text/html',
			);
			return this;
		} catch (error) {
			throw error;
		}
	}

	public async create(plain: Partial<UserAccountEntity>): Promise<UserAccountEntity | null> {
		const user = EntityFactory.create(UserAccountEntity, plain);
		user.createdOn = user.lastModifiedOn = new Date(); // just for validation, will be (re)set on save
		try {
			const errors = await validate(user);
			if (errors.length) {
				this.logger.exception(errors);
				throw Object.assign(new Error('.VALIDATION.FAILED'), {
					details: errors.map(({ property, constraints }) => ({ property, constraints })),
				});
			}
		} catch (error) {
			throw error;
		}
		user.setPassword(user.password);
		try {
			if (this.repo.isReady) {
				const newAccount = await this.repo.save(user);
				// TODO insert real template and change placeholder
				let body = readFileSync(AppInfo.cwd() + '/assets/templates/email.beta.html', { encoding: 'utf-8' }).replace(
					'{{PH_USERNAME}}',
					newAccount?.name + '',
				);
				// TODO setup email on registration correctly
				// await sendEmail(
				// 	Environment.getString('MAIL_FROM', 'readonly@example.com'),
				// 	'spawn@app.com',
				// 	Environment.getString('MAIL_SUBJECT_BETA') || 'New BETA account created',
				// 	body,
				// 	'text/html',
				// );
				// let body = readFileSync(AppInfo.cwd() + "/assets/templates/email.welcome.html", { encoding: 'utf-8' })
				// .replace('{{PH_TEST}}', 'Welcome');
				// await sendEmail(Environment.getString('MAIL_FROM') || 'readonly@example.com', user.email, Environment.getString('MAIL_SUBJECT_WELCOME') || 'Email verification', body, 'text/html');
				// newAccount?.createEmailVerification();
				return newAccount;
			} else {
				throw new Error('.DB.NOCOLLECTION');
			}
		} catch (error) {
			if (error.code == 11000) {
				// Duplicate key
				const [key] = Object.keys(error.keyValue);
				const value = error.keyValue[key];
				this.logger.warn(`Dupe registration tried: ${key} / ${value}`);
				throw new Error('.CREATE.DUPE.' + key.toUpperCase());
			} else {
				this.logger.error(error, error?.response?.body);
				throw error;
			}
		}
	}
}

export const userAccountService = new UserAccountService();
