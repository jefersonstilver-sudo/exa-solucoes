export const isDeleteConfirmationValid = (text: string) => text.trim().toLowerCase() === 'deletar';

export const canDeleteSofiaContact = (role?: string | null) => role === 'admin' || role === 'super_admin';
