import { accountApp } from '@/user-account';
import { ExtendedLogger } from '@/utils';
import { NextFunction, Request, Response } from 'express';
import { Express } from 'express-serve-static-core';
import { NotInitializedException } from '../errors';
import { authRouter } from '../router/auth.router';

class AppAPIController {
	protected logger = new ExtendedLogger(AppAPIController.name);
	private app: Express = null;

	public init(app: Express): void {
		this.app = app;
		app.get('/', this.handleRoot());
		app.use((req, res, next) => {
			this.logger.verbose(`API call <${req.method}:${req.url}>`);
			next();
		});
		this.addRouter('/auth', authRouter); // auth related
		this.addRouter('/account', accountApp); // personal account
	}

	public addRouter(mountPoint: string, router: Express): void {
		if (!this.app) throw new NotInitializedException('Please call init before using this method');
		this.logger.debug(`mounting router ${mountPoint}`);
		this.app.use(mountPoint, router);
	}

	private handleRoot() {
		return (req: Request, res: Response, next: NextFunction) => {
			res.redirect('/api-docs');
		};
	}
}

export const APIController = new AppAPIController();
