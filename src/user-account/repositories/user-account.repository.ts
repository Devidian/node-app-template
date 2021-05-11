import { BaseRepository, DatabaseCollection, ExtendedLogger, MongoCollection } from '@/util';
import { UserAccountEntity } from '../entities/user-account.entity';

class UserAccountRepository extends BaseRepository<UserAccountEntity> {
	@DatabaseCollection<UserAccountEntity>('user', UserAccountEntity, false, [
		{ key: { name: 1 }, name: 'userUniqueNameIndex', background: true, unique: true },
		{
			key: { email: 1 },
			name: 'userUniqueEmailIndex',
			background: true,
			unique: true,
			partialFilterExpression: { $and: [{ email: { $exists: true } }, { email: { $gt: null } }] },
		},
	])
	protected collectionRef: MongoCollection<UserAccountEntity>;
	protected logger = new ExtendedLogger(UserAccountRepository.name);

	public findItemByEmail(email: string): Promise<UserAccountEntity> {
		return this.collectionRef.findItem({ email });
	}

	public findItemBySteamId(id: string): Promise<UserAccountEntity> {
		return this.collectionRef.findItem({ 'steam.id': id });
	}

	public findByName(name: string): UserAccountEntity | PromiseLike<UserAccountEntity> {
		return this.collectionRef.findItem({ name });
	}

	public findBySteamIdentifier(identifier: string): UserAccountEntity | PromiseLike<UserAccountEntity> {
		return this.collectionRef.findItem({ 'steam.identifier': identifier });
	}
}
export const userAccountRepository = new UserAccountRepository();
