import express = require('express');
import { I18nPrefix } from '../enums/i18nPrefix';
import { userAccountRepository } from '../repositories/user-account.repository';

export const databaseGuard: express.RequestHandler = async (req, res, next) => {
	if (!(await userAccountRepository.isReady)) {
		res
			.status(500)
			.send({ error: 'Database not ready', i18n: I18nPrefix.ERROR + '.DB.NOT_READY' })
			.end();
	} else {
		next();
	}
};
