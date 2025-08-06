import { supabase } from './supabaseClient';

export interface UserTransaction {
  id?: string;
  user_address: string;
  package_id: string;
  price_wei: string;
  tx_hash: string;
  timestamp: string;
  style?: number;
  ipfs_hash?: string;
  package_name?: string;
}

export class TransactionService {
  async logPurchase(tx: UserTransaction) {
    const { data, error } = await supabase
      .from('user_transactions')
      .insert([tx]);
    if (error) throw error;
    return data;
  }

  async getUserTransactions(user_address: string) {
    const { data, error } = await supabase
      .from('user_transactions')
      .select('*')
      .eq('user_address', user_address)
      .order('timestamp', { ascending: false });
    if (error) throw error;
    return data;
  }

  async getAllTransactions() {
    const { data, error } = await supabase
      .from('user_transactions')
      .select('*')
      .order('timestamp', { ascending: false });
    if (error) throw error;
    return data;
  }
}