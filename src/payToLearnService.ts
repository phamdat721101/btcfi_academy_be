import { supabase } from './supabaseClient';

export class PayToLearnService {
  async createPackage(pkg: {
    id: string;
    priceWei: string;
    name: string;
    ipfsHash: string;
  }) {
    const { data, error } = await supabase
      .from('packages')
      .insert([pkg]);
    if (error) throw error;
    return data;
  }

  async updatePackage(id: string, updates: Partial<{ priceWei: string; ipfsHash: string; name: string }>) {
    const { data, error } = await supabase
      .from('packages')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
    return data;
  }

  async deletePackage(id: string) {
    const { data, error } = await supabase
      .from('packages')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return data;
  }

  async getAvailablePackages() {
    const { data, error } = await supabase
      .from('packages')
      .select('*');
    if (error) throw error;
    return data;
  }

  async getPackage(id: string) {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async selectStyle(user: string, style: number) {
    const { data, error } = await supabase
      .from('user_styles')
      .upsert([{ user_address: user, style }]);
    if (error) throw error;
    return data;
  }

  async getUserStyle(user: string) {
    const { data, error } = await supabase
      .from('user_styles')
      .select('style')
      .eq('user_address', user)
      .single();
    if (error) throw error;
    return data?.style ?? null;
  }

  async logPurchase(purchase: {
    user_address: string;
    package_id: string;
    pricewei: string;
    tx_hash?: string;
    timestamp: string;
    style?: number;
    ipfshash?: string;
    packagename?: string;
  }) {
    const { data, error } = await supabase
      .from('user_purchases')
      .insert([purchase]);
    if (error) throw error;
    return data;
  }

  async getPurchasedPackages(user: string) {
    const { data, error } = await supabase
      .from('user_purchases')
      .select('package_id')
      .eq('user_address', user);
    if (error) throw error;
    return data?.map((row: any) => row.package_id) ?? [];
  }

  async hasPurchased(user: string, packageId: string) {
    const { data, error } = await supabase
      .from('user_purchases')
      .select('id')
      .eq('user_address', user)
      .eq('package_id', packageId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }
}