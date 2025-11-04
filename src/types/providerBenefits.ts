export interface ProviderBenefit {
  id: string;
  provider_name: string;
  provider_email: string;
  activation_point?: string;
  observation?: string;
  access_token: string;
  token_used: boolean;
  token_used_at?: string;
  benefit_choice?: string;
  benefit_chosen_at?: string;
  gift_code?: string;
  gift_code_inserted_at?: string;
  gift_code_inserted_by?: string;
  status: 'pending' | 'choice_made' | 'code_sent' | 'cancelled';
  invitation_sent_at?: string;
  final_email_sent_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface BenefitOption {
  id: string;
  name: string;
  subtitle?: string;
  icon: string;
  category: 'shopping' | 'food' | 'transport' | 'entertainment';
}

export interface CreateBenefitRequest {
  provider_name: string;
  provider_email: string;
  activation_point?: string;
  observation?: string;
}

export interface TokenValidationResponse {
  valid: boolean;
  error?: string;
  provider_name?: string;
  activation_point?: string;
  benefit_id?: string;
  benefit_choice?: string;
}

export interface BenefitChoiceResponse {
  success: boolean;
  error?: string;
  benefit_id?: string;
  choice?: string;
}
