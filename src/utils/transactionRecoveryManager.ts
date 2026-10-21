interface RecoveryResult { success: boolean; recoveredTransactions: number; totalValue: number; errors: string[]; details: unknown[] }
const disabled = (): RecoveryResult => ({ success: false, recoveredTransactions: 0, totalValue: 0, errors: ['Recuperação automática desativada; consulte uma cobrança por ID oficial Asaas'], details: [] });
export const transactionRecoveryManager = {
  async recoverSpecificTransaction(_email: string, _amount: number) { return disabled(); },
  async autoRecoverUserTransactions(_userId: string) { return disabled(); },
  async monitorRealtimeTransactions(): Promise<void> { /* No automatic financial writes. */ }
};
