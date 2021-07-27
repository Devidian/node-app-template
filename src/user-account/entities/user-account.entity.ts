import { BaseEntity, MongoCollection } from '@/utils';
import { IsEmail, IsNotEmpty, IsOptional, Length } from 'class-validator';
import { hostname } from 'os';
import { cpuUsage } from 'process';

export class UserAccountEntity extends BaseEntity {
	@IsNotEmpty()
	@Length(3)
	name: string;

	password: string; // SHA256

	@IsOptional() // in case of openid we may not have an email on registration
	@IsEmail()
	email: string;

	@IsOptional()
	country: string;

	verification: VerificationEntity[] = [];

	// OpenId
	steam: {
		id: string;
		identifier: string;
		displayName: string;
		photos: { value: string }[];
		connectedOn: Date;
	} | null = null;

	/**
	 * returns large medium or small image if available
	 *
	 * @readonly
	 * @type {string}
	 * @memberof UserAccountEntity
	 */
	public get avatarUrl(): string {
		return this.avatarLargeUrl || this.avatarMediumUrl || this.avatarSmallUrl;
	}

	public get avatarSmallUrl(): string {
		return this.steam?.photos[0]?.value;
	}

	public get avatarMediumUrl(): string {
		return this.steam?.photos[1]?.value;
	}

	public get avatarLargeUrl(): string {
		return this.steam?.photos[2]?.value;
	}

	public get isEmailVerified(): boolean {
		return !!this.verification.find((v) => v.field == 'email' && v.verifiedOn != null);
	}

	/**
	 * returns a clean plain object representing a user account without sensitive data
	 *
	 * @param showPrivate if true, private data will be exposed too
	 */
	public plain(showPrivate: boolean = false): { [key: string]: any } {
		const plain: { [key: string]: any } = super.plain(showPrivate);

		plain.name = this.name;
		// registration email is always a private property and only exposed to owner
		plain.email = showPrivate ? this.email : null;
		// password is never send
		plain.password = null;

		plain.country = this.country;

		plain.steam = this.steam;

		return plain;
	}

	public validatePassword(password: string): boolean {
		return MongoCollection.hash256(password) === this.password;
	}

	public setPassword(pw: string) {
		if (!pw) return;
		this.password = MongoCollection.hash256(pw);
	}

	public createVerificationToken(field: string): UserAccountEntity {
		const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
		const t = MongoCollection.hash256(field + d + Math.random() + hostname() + cpuUsage().system);
		const verificationToken: VerificationEntity = {
			field,
			verifiedOn: null,
			token: t,
			tokenValidUntil: d,
		};
		this.verification = this.verification.filter((v) => v.field != field);
		this.verification.push(verificationToken);
		return this;
	}
}
