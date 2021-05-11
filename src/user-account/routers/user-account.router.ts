import express = require('express');
import { authGuard } from '@/app/guards/auth.guard';
import { accountController } from '../controllers/user-account.controller';
import { databaseGuard } from '../guards/database.guard';

const app = express();
app.disable('x-powered-by');

app.post('/', databaseGuard, accountController.createAccount());
app.patch('/', databaseGuard, authGuard, accountController.updateAccount());

app.get('/', databaseGuard, authGuard, accountController.getAccount());

app.post('/verify/email', databaseGuard, accountController.verifyEmail());

app.patch('/password', databaseGuard, authGuard, accountController.changePassword());

export const accountApp = app;
