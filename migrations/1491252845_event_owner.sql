DELETE FROM permission WHERE (relation != 'catalex' and relation != 'user');
ALTER TABLE event RENAME COLUMN "userId" TO "ownerId";