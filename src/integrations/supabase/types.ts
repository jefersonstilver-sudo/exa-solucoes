export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      building_action_logs: {
        Row: {
          action_description: string | null
          action_type: string
          building_id: string | null
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          user_id: string | null
        }
        Insert: {
          action_description?: string | null
          action_type: string
          building_id?: string | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Update: {
          action_description?: string | null
          action_type?: string
          building_id?: string | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "building_action_logs_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          amenities: string[] | null
          audience_profile: string[] | null
          bairro: string
          caracteristicas: string[] | null
          contato_sindico: string | null
          contato_vice_sindico: string | null
          created_at: string | null
          endereco: string
          id: string
          image_urls: string[] | null
          imagem_2: string | null
          imagem_3: string | null
          imagem_4: string | null
          imagem_principal: string | null
          imageurl: string | null
          latitude: number | null
          location_type: string
          longitude: number | null
          monthly_traffic: number | null
          nome: string
          nome_contato_predio: string | null
          nome_sindico: string | null
          nome_vice_sindico: string | null
          numero_contato_predio: string | null
          numero_unidades: number | null
          padrao_publico: string | null
          peak_hours: string | null
          preco_base: number | null
          publico_estimado: number | null
          quantidade_telas: number | null
          status: string
          venue_type: string | null
          visualizacoes_mes: number | null
        }
        Insert: {
          amenities?: string[] | null
          audience_profile?: string[] | null
          bairro: string
          caracteristicas?: string[] | null
          contato_sindico?: string | null
          contato_vice_sindico?: string | null
          created_at?: string | null
          endereco: string
          id?: string
          image_urls?: string[] | null
          imagem_2?: string | null
          imagem_3?: string | null
          imagem_4?: string | null
          imagem_principal?: string | null
          imageurl?: string | null
          latitude?: number | null
          location_type?: string
          longitude?: number | null
          monthly_traffic?: number | null
          nome: string
          nome_contato_predio?: string | null
          nome_sindico?: string | null
          nome_vice_sindico?: string | null
          numero_contato_predio?: string | null
          numero_unidades?: number | null
          padrao_publico?: string | null
          peak_hours?: string | null
          preco_base?: number | null
          publico_estimado?: number | null
          quantidade_telas?: number | null
          status?: string
          venue_type?: string | null
          visualizacoes_mes?: number | null
        }
        Update: {
          amenities?: string[] | null
          audience_profile?: string[] | null
          bairro?: string
          caracteristicas?: string[] | null
          contato_sindico?: string | null
          contato_vice_sindico?: string | null
          created_at?: string | null
          endereco?: string
          id?: string
          image_urls?: string[] | null
          imagem_2?: string | null
          imagem_3?: string | null
          imagem_4?: string | null
          imagem_principal?: string | null
          imageurl?: string | null
          latitude?: number | null
          location_type?: string
          longitude?: number | null
          monthly_traffic?: number | null
          nome?: string
          nome_contato_predio?: string | null
          nome_sindico?: string | null
          nome_vice_sindico?: string | null
          numero_contato_predio?: string | null
          numero_unidades?: number | null
          padrao_publico?: string | null
          peak_hours?: string | null
          preco_base?: number | null
          publico_estimado?: number | null
          quantidade_telas?: number | null
          status?: string
          venue_type?: string | null
          visualizacoes_mes?: number | null
        }
        Relationships: []
      }
      campanhas: {
        Row: {
          client_id: string
          created_at: string | null
          data_fim: string
          data_inicio: string
          id: string
          obs: string | null
          painel_id: string
          status: string
          video_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          data_fim: string
          data_inicio: string
          id?: string
          obs?: string | null
          painel_id: string
          status?: string
          video_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          id?: string
          obs?: string | null
          painel_id?: string
          status?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campanhas_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanhas_painel_id_fkey"
            columns: ["painel_id"]
            isOneToOne: false
            referencedRelation: "painels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanhas_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_sistema: {
        Row: {
          created_at: string | null
          id: string
          modo_emergencia: boolean
          seed_hash: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          modo_emergencia?: boolean
          seed_hash: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          modo_emergencia?: boolean
          seed_hash?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cupom_usos: {
        Row: {
          created_at: string
          cupom_id: string
          id: string
          pedido_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          cupom_id: string
          id?: string
          pedido_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          cupom_id?: string
          id?: string
          pedido_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cupom_usos_cupom_id_fkey"
            columns: ["cupom_id"]
            isOneToOne: false
            referencedRelation: "cupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cupom_usos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      cupons: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          created_by: string | null
          desconto_percentual: number
          expira_em: string | null
          id: string
          max_usos: number
          min_meses: number
          usos_atuais: number
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          created_by?: string | null
          desconto_percentual: number
          expira_em?: string | null
          id?: string
          max_usos?: number
          min_meses?: number
          usos_atuais?: number
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          created_by?: string | null
          desconto_percentual?: number
          expira_em?: string | null
          id?: string
          max_usos?: number
          min_meses?: number
          usos_atuais?: number
        }
        Relationships: []
      }
      log_eventos_sistema: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          ip: string | null
          tipo_evento: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          ip?: string | null
          tipo_evento: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          ip?: string | null
          tipo_evento?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      painel_logs: {
        Row: {
          created_at: string | null
          id: string
          painel_id: string
          status_sincronizacao: string
          temperatura: number | null
          timestamp: string | null
          uso_cpu: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          painel_id: string
          status_sincronizacao: string
          temperatura?: number | null
          timestamp?: string | null
          uso_cpu?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          painel_id?: string
          status_sincronizacao?: string
          temperatura?: number | null
          timestamp?: string | null
          uso_cpu?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "painel_logs_painel_id_fkey"
            columns: ["painel_id"]
            isOneToOne: false
            referencedRelation: "painels"
            referencedColumns: ["id"]
          },
        ]
      }
      painels: {
        Row: {
          building_id: string | null
          code: string
          codigo_anydesk: string | null
          created_at: string | null
          id: string
          ip_interno: string | null
          localizacao: string | null
          mac_address: string | null
          marca: string | null
          modelo: string | null
          modo: string | null
          observacoes: string | null
          orientacao: string | null
          polegada: string | null
          resolucao: string | null
          senha_anydesk: string | null
          sistema_operacional: string | null
          status: string
          ultima_sync: string | null
          versao_firmware: string | null
        }
        Insert: {
          building_id?: string | null
          code: string
          codigo_anydesk?: string | null
          created_at?: string | null
          id?: string
          ip_interno?: string | null
          localizacao?: string | null
          mac_address?: string | null
          marca?: string | null
          modelo?: string | null
          modo?: string | null
          observacoes?: string | null
          orientacao?: string | null
          polegada?: string | null
          resolucao?: string | null
          senha_anydesk?: string | null
          sistema_operacional?: string | null
          status?: string
          ultima_sync?: string | null
          versao_firmware?: string | null
        }
        Update: {
          building_id?: string | null
          code?: string
          codigo_anydesk?: string | null
          created_at?: string | null
          id?: string
          ip_interno?: string | null
          localizacao?: string | null
          mac_address?: string | null
          marca?: string | null
          modelo?: string | null
          modo?: string | null
          observacoes?: string | null
          orientacao?: string | null
          polegada?: string | null
          resolucao?: string | null
          senha_anydesk?: string | null
          sistema_operacional?: string | null
          status?: string
          ultima_sync?: string | null
          versao_firmware?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "painels_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          client_id: string
          created_at: string | null
          cupom_id: string | null
          data_fim: string | null
          data_inicio: string | null
          duracao: number | null
          id: string
          lista_paineis: string[] | null
          log_pagamento: Json | null
          plano_meses: number
          status: string
          termos_aceitos: boolean | null
          valor_total: number | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          cupom_id?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          duracao?: number | null
          id?: string
          lista_paineis?: string[] | null
          log_pagamento?: Json | null
          plano_meses?: number
          status?: string
          termos_aceitos?: boolean | null
          valor_total?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          cupom_id?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          duracao?: number | null
          id?: string
          lista_paineis?: string[] | null
          log_pagamento?: Json | null
          plano_meses?: number
          status?: string
          termos_aceitos?: boolean | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_cupom_id_fkey"
            columns: ["cupom_id"]
            isOneToOne: false
            referencedRelation: "cupons"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_codes: {
        Row: {
          campanha_id: string
          created_at: string | null
          id: string
          total_scans: number | null
          url: string
        }
        Insert: {
          campanha_id: string
          created_at?: string | null
          id?: string
          total_scans?: number | null
          url: string
        }
        Update: {
          campanha_id?: string
          created_at?: string | null
          id?: string
          total_scans?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
        ]
      }
      tentativas_compra: {
        Row: {
          created_at: string
          credencial: string | null
          id: string
          id_user: string
          predios_selecionados: number[] | null
          valor_total: number | null
        }
        Insert: {
          created_at?: string
          credencial?: string | null
          id?: string
          id_user: string
          predios_selecionados?: number[] | null
          valor_total?: number | null
        }
        Update: {
          created_at?: string
          credencial?: string | null
          id?: string
          id_user?: string
          predios_selecionados?: number[] | null
          valor_total?: number | null
        }
        Relationships: []
      }
      users: {
        Row: {
          data_criacao: string | null
          email: string
          id: string
          role: string
        }
        Insert: {
          data_criacao?: string | null
          email: string
          id: string
          role: string
        }
        Update: {
          data_criacao?: string | null
          email?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          client_id: string
          created_at: string | null
          duracao: number | null
          id: string
          nome: string
          origem: string
          status: string
          url: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          duracao?: number | null
          id?: string
          nome: string
          origem: string
          status?: string
          url: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          duracao?: number | null
          id?: string
          nome?: string
          origem?: string
          status?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          id: string
          origem: string
          payload: Json | null
          recebido_em: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          origem: string
          payload?: Json | null
          recebido_em?: string | null
          status: string
        }
        Update: {
          created_at?: string | null
          id?: string
          origem?: string
          payload?: Json | null
          recebido_em?: string | null
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_check_user_exists: {
        Args: { user_email: string }
        Returns: boolean
      }
      admin_get_all_user_ids: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      admin_insert_user: {
        Args: { user_id: string; user_email: string; user_role: string }
        Returns: string
      }
      check_panel_availability: {
        Args: { p_panel_id: string; p_start_date: string; p_end_date: string }
        Returns: boolean
      }
      check_user_data_integrity: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          email: string
          users_role: string
          metadata_role: string
          is_consistent: boolean
        }[]
      }
      get_approvals_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          pago_pendente_video: number
          video_enviado: number
          video_aprovado: number
          video_rejeitado: number
        }[]
      }
      get_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_panels_by_location: {
        Args: { lat: number; lng: number; radius_meters: number }
        Returns: {
          id: string
          code: string
          building_id: string
          status: string
          ultima_sync: string
          resolucao: string
          modo: string
          buildings: Json
        }[]
      }
      get_pedidos_com_clientes: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          created_at: string
          status: string
          valor_total: number
          lista_paineis: string[]
          plano_meses: number
          data_inicio: string
          data_fim: string
          client_id: string
          client_email: string
          client_name: string
          video_status: string
        }[]
      }
      get_real_revenue: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_emergency_mode: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin_secure: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin_simple: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_building_action: {
        Args: {
          p_building_id: string
          p_action_type: string
          p_description: string
          p_old_values?: Json
          p_new_values?: Json
        }
        Returns: string
      }
      validate_cupom: {
        Args: { p_codigo: string; p_meses: number }
        Returns: {
          id: string
          codigo: string
          desconto_percentual: number
          valid: boolean
          message: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
