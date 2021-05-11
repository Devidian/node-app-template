import { accountApp } from '@/user-account';
import { ExtendedLogger } from '@/utils';
import { NextFunction, Request, Response } from 'express';
import { Express } from 'express-serve-static-core';
import { authRouter } from '../router/auth.router';

/**
 *
 *
 * @export
 * @class AppAPIController
 */
export class AppAPIController {
	protected logger = new ExtendedLogger(AppAPIController.name);

	constructor(private app: Express) {
		this.logger.debug(`Adding routes to API`);
		app.get('/', this.handleRoot());
		// mount /auth -> passport
		app.use('/auth', authRouter); // auth related
		app.use('/account', accountApp); // personal account
	}

	handleRoot() {
		return (req: Request, res: Response, next: NextFunction) => {
			res.redirect('/api-docs');
		};
	}
}
