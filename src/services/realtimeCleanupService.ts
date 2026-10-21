export const executeAutomaticCleanup = async () => ({ success: false, cleaned_count: 0 });
export const forceMigrateOrphanedPayments = async () => ({ success: false, migrated_count: 0 });
export const setupPeriodicCleanup = () => () => {};
