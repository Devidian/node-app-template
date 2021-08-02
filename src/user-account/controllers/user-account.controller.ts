import { ExtendedLogger } from '@/utils';
import { validate } from 'class-validator';
import { RequestHandler } from 'express';
import { UserAccountEntity } from '../entities/user-account.entity';
import { I18nPrefix } from '../enums/i18nPrefix';
import { userAccountService } from '../services/user-account.service';

/**
 * This controller is for /account
 *
 * @class Controller
 */
class Controller {
	protected service = userAccountService;
	protected logger = new ExtendedLogger('AccountController');

	public createAccount(): RequestHandler {
		return async (req, res) => {
			let userAccount: UserAccountEntity;
			this.service
				.create(req.body)
				.then((createdUser) => {
					userAccount = createdUser as UserAccountEntity;
					return validate(userAccount);
				})
				.then((err) => {
					if (err && err.length > 0) {
						const errShort = err.map(({ property, constraints }) => ({ property, constraints }));
						res.status(400).send({
							error: 'ERROR.VALIDATION.FAILED',
							i18n: I18nPrefix.ERROR + '.VALIDATION.FAILED',
							details: errShort,
						});
					} else {
						res.send(userAccount.toPlain(['owner']));
					}
				})
				.catch((r: Error & { details: any }) => {
					res.status(400).send({ error: r.message, i18n: I18nPrefix.ERROR + r.message, details: r.details });
				})
				.finally(() => {
					res.end();
				});
		};
	}

	public updateAccount(): RequestHandler {
		return async (req, res) => {
			const user: UserAccountEntity = req.user as UserAccountEntity;
			const { account: userAcountUpdateDto } = req.body;
			await this.service.updateAccount(user, userAcountUpdateDto);
			res.send(user.toPlain(['owner'])).end();
		};
	}

	public verifyEmail(): RequestHandler {
		return async (req, res) => {
			const { email, token } = req.body;
			const user = await this.service.findByEmail(email);
			if (!user) {
				res
					.status(400)
					.send({ error: 'User not found', i18n: `${I18nPrefix.ERROR}.EMAILNOTFOUND` })
					.end();
			} else if (user) {
				try {
					this.service.verifyEmail(user, token);
					res.send({ success: true }).end();
				} catch (error) {
					res
						.status(400)
						.send({ error: error.message, i18n: I18nPrefix.ERROR + error.message })
						.end();
				}
			}
		};
	}

	public changePassword(): RequestHandler {
		return async (req, res) => {
			const user: UserAccountEntity = req.user as UserAccountEntity;
			// TODO change password here
			// console.log(req.body);
			res.send(user.toPlain(['owner'])).end();
		};
	}

	public getAccount(): RequestHandler {
		return async (req, res) => {
			const user: UserAccountEntity = req.user as UserAccountEntity;
			const response = user?.toPlain(['owner']);
			res.status(200).send(response).end();
		};
	}
}

export const accountController = new Controller();
