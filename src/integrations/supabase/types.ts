export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
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
      building_geocodes: {
        Row: {
          address: string
          building_id: string | null
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          normalized_address: string
          precision: string | null
          provider: string | null
          raw: Json | null
          updated_at: string
        }
        Insert: {
          address: string
          building_id?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          normalized_address: string
          precision?: string | null
          provider?: string | null
          raw?: Json | null
          updated_at?: string
        }
        Update: {
          address?: string
          building_id?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          normalized_address?: string
          precision?: string | null
          provider?: string | null
          raw?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      building_pin_adjustments: {
        Row: {
          adjusted_by: string
          building_id: string
          created_at: string
          id: string
          new_latitude: number
          new_longitude: number
          old_latitude: number | null
          old_longitude: number | null
          reason: string | null
        }
        Insert: {
          adjusted_by: string
          building_id: string
          created_at?: string
          id?: string
          new_latitude: number
          new_longitude: number
          old_latitude?: number | null
          old_longitude?: number | null
          reason?: string | null
        }
        Update: {
          adjusted_by?: string
          building_id?: string
          created_at?: string
          id?: string
          new_latitude?: number
          new_longitude?: number
          old_latitude?: number | null
          old_longitude?: number | null
          reason?: string | null
        }
        Relationships: []
      }
      buildings: {
        Row: {
          amenities: string[] | null
          audience_profile: string[] | null
          bairro: string
          caracteristicas: string[] | null
          codigo_predio: string | null
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
          manual_latitude: number | null
          manual_longitude: number | null
          monthly_traffic: number | null
          nome: string
          nome_contato_predio: string | null
          nome_sindico: string | null
          nome_vice_sindico: string | null
          numero_andares: number | null
          numero_blocos: number | null
          numero_contato_predio: string | null
          numero_elevadores: number | null
          numero_unidades: number | null
          padrao_publico: string | null
          peak_hours: string | null
          position_validated: boolean | null
          position_validation_date: string | null
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
          codigo_predio?: string | null
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
          manual_latitude?: number | null
          manual_longitude?: number | null
          monthly_traffic?: number | null
          nome: string
          nome_contato_predio?: string | null
          nome_sindico?: string | null
          nome_vice_sindico?: string | null
          numero_andares?: number | null
          numero_blocos?: number | null
          numero_contato_predio?: string | null
          numero_elevadores?: number | null
          numero_unidades?: number | null
          padrao_publico?: string | null
          peak_hours?: string | null
          position_validated?: boolean | null
          position_validation_date?: string | null
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
          codigo_predio?: string | null
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
          manual_latitude?: number | null
          manual_longitude?: number | null
          monthly_traffic?: number | null
          nome?: string
          nome_contato_predio?: string | null
          nome_sindico?: string | null
          nome_vice_sindico?: string | null
          numero_andares?: number | null
          numero_blocos?: number | null
          numero_contato_predio?: string | null
          numero_elevadores?: number | null
          numero_unidades?: number | null
          padrao_publico?: string | null
          peak_hours?: string | null
          position_validated?: boolean | null
          position_validation_date?: string | null
          preco_base?: number | null
          publico_estimado?: number | null
          quantidade_telas?: number | null
          status?: string
          venue_type?: string | null
          visualizacoes_mes?: number | null
        }
        Relationships: []
      }
      campaign_schedule_rules: {
        Row: {
          campaign_video_schedule_id: string
          created_at: string
          days_of_week: number[]
          end_time: string
          id: string
          is_active: boolean
          is_all_day: boolean
          start_time: string
          updated_at: string
        }
        Insert: {
          campaign_video_schedule_id: string
          created_at?: string
          days_of_week: number[]
          end_time: string
          id?: string
          is_active?: boolean
          is_all_day?: boolean
          start_time: string
          updated_at?: string
        }
        Update: {
          campaign_video_schedule_id?: string
          created_at?: string
          days_of_week?: number[]
          end_time?: string
          id?: string
          is_active?: boolean
          is_all_day?: boolean
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_schedule_rules_campaign_video_schedule_id_fkey"
            columns: ["campaign_video_schedule_id"]
            isOneToOne: false
            referencedRelation: "campaign_video_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_video_schedules: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          priority: number
          slot_position: number
          updated_at: string
          video_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          priority?: number
          slot_position: number
          updated_at?: string
          video_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          priority?: number
          slot_position?: number
          updated_at?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_video_schedules_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns_advanced"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns_advanced: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          end_date: string
          id: string
          name: string
          pedido_id: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          name: string
          pedido_id: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          name?: string
          pedido_id?: string
          start_date?: string
          status?: string
          updated_at?: string
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
      campanhas_portfolio: {
        Row: {
          capa_url: string | null
          categoria: string
          cliente: string
          created_at: string
          descricao: string | null
          id: string
          titulo: string
          updated_at: string
          url_video: string
        }
        Insert: {
          capa_url?: string | null
          categoria: string
          cliente: string
          created_at?: string
          descricao?: string | null
          id?: string
          titulo: string
          updated_at?: string
          url_video: string
        }
        Update: {
          capa_url?: string | null
          categoria?: string
          cliente?: string
          created_at?: string
          descricao?: string | null
          id?: string
          titulo?: string
          updated_at?: string
          url_video?: string
        }
        Relationships: []
      }
      client_logos: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          link: string | null
          logo_url: string
          name: string
          order_position: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          link?: string | null
          logo_url: string
          name: string
          order_position?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          link?: string | null
          logo_url?: string
          name?: string
          order_position?: number
          updated_at?: string
        }
        Relationships: []
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
      coupon_security_events: {
        Row: {
          coupon_code: string | null
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          coupon_code?: string | null
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
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
          categoria: string | null
          codigo: string
          created_at: string
          created_by: string | null
          data_inicio: string | null
          desconto_percentual: number
          descricao: string | null
          expira_em: string | null
          id: string
          max_usos: number
          min_meses: number
          tipo_desconto: string | null
          uso_por_usuario: number | null
          usos_atuais: number
          valor_minimo_pedido: number | null
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          codigo: string
          created_at?: string
          created_by?: string | null
          data_inicio?: string | null
          desconto_percentual: number
          descricao?: string | null
          expira_em?: string | null
          id?: string
          max_usos?: number
          min_meses?: number
          tipo_desconto?: string | null
          uso_por_usuario?: number | null
          usos_atuais?: number
          valor_minimo_pedido?: number | null
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          codigo?: string
          created_at?: string
          created_by?: string | null
          data_inicio?: string | null
          desconto_percentual?: number
          descricao?: string | null
          expira_em?: string | null
          id?: string
          max_usos?: number
          min_meses?: number
          tipo_desconto?: string | null
          uso_por_usuario?: number | null
          usos_atuais?: number
          valor_minimo_pedido?: number | null
        }
        Relationships: []
      }
      developer_auth_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          token_hash: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          is_active?: boolean
          token_hash: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          token_hash?: string
        }
        Relationships: []
      }
      homepage_banners: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          order_position: number
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          order_position?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          order_position?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      homepage_config: {
        Row: {
          button_icon: string
          button_text: string
          created_at: string
          href: string
          id: string
          image_url: string
          service_type: string
          title: string
          updated_at: string
        }
        Insert: {
          button_icon: string
          button_text: string
          created_at?: string
          href: string
          id?: string
          image_url: string
          service_type: string
          title: string
          updated_at?: string
        }
        Update: {
          button_icon?: string
          button_text?: string
          created_at?: string
          href?: string
          id?: string
          image_url?: string
          service_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads_exa: {
        Row: {
          cargo: string
          contato_realizado: boolean
          created_at: string
          id: string
          nome_completo: string
          nome_empresa: string
          objetivo: string | null
          status: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          cargo: string
          contato_realizado?: boolean
          created_at?: string
          id?: string
          nome_completo: string
          nome_empresa: string
          objetivo?: string | null
          status?: string
          updated_at?: string
          whatsapp: string
        }
        Update: {
          cargo?: string
          contato_realizado?: boolean
          created_at?: string
          id?: string
          nome_completo?: string
          nome_empresa?: string
          objetivo?: string | null
          status?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      leads_linkae: {
        Row: {
          cargo: string
          contato_realizado: boolean
          created_at: string
          id: string
          nome_completo: string
          nome_empresa: string
          objetivo: string | null
          status: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          cargo: string
          contato_realizado?: boolean
          created_at?: string
          id?: string
          nome_completo: string
          nome_empresa: string
          objetivo?: string | null
          status?: string
          updated_at?: string
          whatsapp: string
        }
        Update: {
          cargo?: string
          contato_realizado?: boolean
          created_at?: string
          id?: string
          nome_completo?: string
          nome_empresa?: string
          objetivo?: string | null
          status?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      leads_produtora: {
        Row: {
          agendar_cafe: boolean
          contato_realizado: boolean
          created_at: string
          email: string
          empresa: string | null
          id: string
          nome: string
          objetivo: string | null
          tipo_video: string | null
          whatsapp: string
        }
        Insert: {
          agendar_cafe?: boolean
          contato_realizado?: boolean
          created_at?: string
          email: string
          empresa?: string | null
          id?: string
          nome: string
          objetivo?: string | null
          tipo_video?: string | null
          whatsapp: string
        }
        Update: {
          agendar_cafe?: boolean
          contato_realizado?: boolean
          created_at?: string
          email?: string
          empresa?: string | null
          id?: string
          nome?: string
          objetivo?: string | null
          tipo_video?: string | null
          whatsapp?: string
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
      logos: {
        Row: {
          color_variant: string
          created_at: string
          file_url: string
          id: string
          is_active: boolean
          link_url: string | null
          name: string
          sort_order: number
          storage_bucket: string | null
          storage_key: string | null
          updated_at: string
        }
        Insert: {
          color_variant?: string
          created_at?: string
          file_url: string
          id?: string
          is_active?: boolean
          link_url?: string | null
          name: string
          sort_order?: number
          storage_bucket?: string | null
          storage_key?: string | null
          updated_at?: string
        }
        Update: {
          color_variant?: string
          created_at?: string
          file_url?: string
          id?: string
          is_active?: boolean
          link_url?: string | null
          name?: string
          sort_order?: number
          storage_bucket?: string | null
          storage_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
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
      panel_access_logs: {
        Row: {
          access_type: string
          created_at: string | null
          id: string
          ip_address: string | null
          panel_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          access_type: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          panel_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          panel_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "panel_access_logs_panel_id_fkey"
            columns: ["panel_id"]
            isOneToOne: false
            referencedRelation: "painels"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_processing_control: {
        Row: {
          amount: number | null
          created_at: string | null
          details: Json | null
          external_reference: string | null
          id: string
          payment_id: string
          pedido_id: string | null
          processed_at: string | null
          webhook_source: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          details?: Json | null
          external_reference?: string | null
          id?: string
          payment_id: string
          pedido_id?: string | null
          processed_at?: string | null
          webhook_source?: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          details?: Json | null
          external_reference?: string | null
          id?: string
          payment_id?: string
          pedido_id?: string | null
          processed_at?: string | null
          webhook_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_processing_control_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_status_tracking: {
        Row: {
          created_at: string | null
          detalhes: Json | null
          id: string
          origem: string
          pedido_id: string
          status_anterior: string
          status_novo: string
        }
        Insert: {
          created_at?: string | null
          detalhes?: Json | null
          id?: string
          origem: string
          pedido_id: string
          status_anterior: string
          status_novo: string
        }
        Update: {
          created_at?: string | null
          detalhes?: Json | null
          id?: string
          origem?: string
          pedido_id?: string
          status_anterior?: string
          status_novo?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_status_tracking_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_videos: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          is_active: boolean
          is_base_video: boolean
          pedido_id: string
          rejection_reason: string | null
          selected_for_display: boolean
          slot_position: number
          updated_at: string
          video_id: string
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_base_video?: boolean
          pedido_id: string
          rejection_reason?: string | null
          selected_for_display?: boolean
          slot_position: number
          updated_at?: string
          video_id: string
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_base_video?: boolean
          pedido_id?: string
          rejection_reason?: string | null
          selected_for_display?: boolean
          slot_position?: number
          updated_at?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedido_videos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_videos_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          client_id: string
          compliance_data: Json | null
          created_at: string | null
          cupom_id: string | null
          data_fim: string | null
          data_inicio: string | null
          email: string | null
          id: string
          lista_paineis: string[] | null
          lista_predios: string[] | null
          log_pagamento: Json | null
          mercadopago_transaction_id: string | null
          plano_meses: number
          price_sync_verified: boolean | null
          source_tentativa_id: string | null
          status: string
          termos_aceitos: boolean | null
          transaction_id: string | null
          valor_total: number | null
        }
        Insert: {
          client_id: string
          compliance_data?: Json | null
          created_at?: string | null
          cupom_id?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          email?: string | null
          id?: string
          lista_paineis?: string[] | null
          lista_predios?: string[] | null
          log_pagamento?: Json | null
          mercadopago_transaction_id?: string | null
          plano_meses?: number
          price_sync_verified?: boolean | null
          source_tentativa_id?: string | null
          status?: string
          termos_aceitos?: boolean | null
          transaction_id?: string | null
          valor_total?: number | null
        }
        Update: {
          client_id?: string
          compliance_data?: Json | null
          created_at?: string | null
          cupom_id?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          email?: string | null
          id?: string
          lista_paineis?: string[] | null
          lista_predios?: string[] | null
          log_pagamento?: Json | null
          mercadopago_transaction_id?: string | null
          plano_meses?: number
          price_sync_verified?: boolean | null
          source_tentativa_id?: string | null
          status?: string
          termos_aceitos?: boolean | null
          transaction_id?: string | null
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
      portfolio_produtora: {
        Row: {
          categoria: string
          created_at: string
          descricao: string | null
          id: string
          titulo: string
          url_video: string
        }
        Insert: {
          categoria: string
          created_at?: string
          descricao?: string | null
          id?: string
          titulo: string
          url_video: string
        }
        Update: {
          categoria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          titulo?: string
          url_video?: string
        }
        Relationships: []
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
      sindicos_interessados: {
        Row: {
          celular: string
          created_at: string
          data_contato: string | null
          email: string
          endereco: string
          id: string
          nome_completo: string
          nome_predio: string
          numero_andares: number
          numero_unidades: number
          observacoes: string | null
          responsavel_contato: string | null
          status: string
          updated_at: string
        }
        Insert: {
          celular: string
          created_at?: string
          data_contato?: string | null
          email: string
          endereco: string
          id?: string
          nome_completo: string
          nome_predio: string
          numero_andares: number
          numero_unidades: number
          observacoes?: string | null
          responsavel_contato?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          celular?: string
          created_at?: string
          data_contato?: string | null
          email?: string
          endereco?: string
          id?: string
          nome_completo?: string
          nome_predio?: string
          numero_andares?: number
          numero_unidades?: number
          observacoes?: string | null
          responsavel_contato?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      tentativas_compra: {
        Row: {
          created_at: string | null
          credencial: string | null
          id: string
          id_user: string
          predio: string | null
          predios_selecionados: string[] | null
          price_calculation_log: Json | null
          price_locked: boolean | null
          transaction_id: string | null
          valor_total: number | null
        }
        Insert: {
          created_at?: string | null
          credencial?: string | null
          id?: string
          id_user: string
          predio?: string | null
          predios_selecionados?: string[] | null
          price_calculation_log?: Json | null
          price_locked?: boolean | null
          transaction_id?: string | null
          valor_total?: number | null
        }
        Update: {
          created_at?: string | null
          credencial?: string | null
          id?: string
          id_user?: string
          predio?: string | null
          predios_selecionados?: string[] | null
          price_calculation_log?: Json | null
          price_locked?: boolean | null
          transaction_id?: string | null
          valor_total?: number | null
        }
        Relationships: []
      }
      transaction_sessions: {
        Row: {
          calculated_price: number
          cart_items: Json
          created_at: string
          id: string
          payment_external_id: string | null
          pedido_id: string | null
          selected_plan: number
          status: string
          tentativa_id: string | null
          transaction_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calculated_price: number
          cart_items: Json
          created_at?: string
          id?: string
          payment_external_id?: string | null
          pedido_id?: string | null
          selected_plan: number
          status?: string
          tentativa_id?: string | null
          transaction_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calculated_price?: number
          cart_items?: Json
          created_at?: string
          id?: string
          payment_external_id?: string | null
          pedido_id?: string | null
          selected_plan?: number
          status?: string
          tentativa_id?: string | null
          transaction_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          data_criacao: string | null
          documento_estrangeiro: string | null
          documento_frente_url: string | null
          documento_verso_url: string | null
          email: string
          email_verified_at: string | null
          id: string
          privacy_accepted_at: string | null
          role: string
          terms_accepted_at: string | null
          tipo_documento: string | null
        }
        Insert: {
          avatar_url?: string | null
          cpf?: string | null
          data_criacao?: string | null
          documento_estrangeiro?: string | null
          documento_frente_url?: string | null
          documento_verso_url?: string | null
          email: string
          email_verified_at?: string | null
          id: string
          privacy_accepted_at?: string | null
          role: string
          terms_accepted_at?: string | null
          tipo_documento?: string | null
        }
        Update: {
          avatar_url?: string | null
          cpf?: string | null
          data_criacao?: string | null
          documento_estrangeiro?: string | null
          documento_frente_url?: string | null
          documento_verso_url?: string | null
          email?: string
          email_verified_at?: string | null
          id?: string
          privacy_accepted_at?: string | null
          role?: string
          terms_accepted_at?: string | null
          tipo_documento?: string | null
        }
        Relationships: []
      }
      video_management_logs: {
        Row: {
          action_type: string
          created_at: string | null
          details: Json | null
          id: string
          pedido_id: string
          slot_from: number | null
          slot_to: number | null
          video_from_id: string | null
          video_to_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          pedido_id: string
          slot_from?: number | null
          slot_to?: number | null
          video_from_id?: string | null
          video_to_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          pedido_id?: string
          slot_from?: number | null
          slot_to?: number | null
          video_from_id?: string | null
          video_to_id?: string | null
        }
        Relationships: []
      }
      videos: {
        Row: {
          altura: number | null
          client_id: string
          created_at: string | null
          duracao: number | null
          formato: string | null
          id: string
          largura: number | null
          nome: string
          orientacao: string | null
          origem: string
          status: string
          tamanho_arquivo: number | null
          tem_audio: boolean | null
          url: string
        }
        Insert: {
          altura?: number | null
          client_id: string
          created_at?: string | null
          duracao?: number | null
          formato?: string | null
          id?: string
          largura?: number | null
          nome: string
          orientacao?: string | null
          origem: string
          status?: string
          tamanho_arquivo?: number | null
          tem_audio?: boolean | null
          url: string
        }
        Update: {
          altura?: number | null
          client_id?: string
          created_at?: string | null
          duracao?: number | null
          formato?: string | null
          id?: string
          largura?: number | null
          nome?: string
          orientacao?: string | null
          origem?: string
          status?: string
          tamanho_arquivo?: number | null
          tem_audio?: boolean | null
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
      activate_video: {
        Args: { p_pedido_id: string; p_pedido_video_id: string }
        Returns: boolean
      }
      admin_check_user_exists: {
        Args: { user_email: string }
        Returns: boolean
      }
      admin_get_all_user_ids: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      admin_insert_user: {
        Args: { user_email: string; user_id: string; user_role: string }
        Returns: string
      }
      admin_update_user_role_secure: {
        Args: { p_admin_id?: string; p_new_role: string; p_user_id: string }
        Returns: Json
      }
      apply_coupon_secure: {
        Args: { p_codigo: string; p_pedido_id: string }
        Returns: Json
      }
      approve_video: {
        Args: { p_approved_by: string; p_pedido_video_id: string }
        Returns: boolean
      }
      audit_unauthorized_uploads: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      auto_cleanup_paid_attempts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      auto_fix_lost_transactions: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      auto_recovery_system: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      can_access_building_contacts: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_access_order: {
        Args: { p_pedido_id: string }
        Returns: boolean
      }
      can_access_panel_credentials: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      cancel_expired_orders: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_panel_availability: {
        Args: { p_end_date: string; p_panel_id: string; p_start_date: string }
        Returns: boolean
      }
      check_payment_already_processed: {
        Args: { p_payment_id: string }
        Returns: boolean
      }
      check_user_data_integrity: {
        Args: Record<PropertyKey, never>
        Returns: {
          email: string
          is_consistent: boolean
          metadata_role: string
          user_id: string
          users_role: string
        }[]
      }
      check_video_schedule_conflict: {
        Args: { p_video1_id: string; p_video2_id: string }
        Returns: boolean
      }
      cleanup_orphaned_users: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      cleanup_unauthorized_uploads: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      daily_financial_reconciliation: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      detect_duplicate_payments: {
        Args: Record<PropertyKey, never>
        Returns: {
          client_id: string
          created_at: string
          external_reference: string
          payment_id: string
          pedido_id: string
          status: string
          suspicious_reason: string
          valor_total: number
        }[]
      }
      detect_financial_anomalies: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      diagnose_user_system: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      emergency_financial_audit_and_fix: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      ensure_video_consistency: {
        Args: { p_pedido_id: string }
        Returns: Json
      }
      extract_compliance_data: {
        Args: { payment_data: Json }
        Returns: Json
      }
      generate_coupon_code: {
        Args: { prefix?: string }
        Returns: string
      }
      generate_developer_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_secure_temp_password: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_admin_buildings_safe: {
        Args: Record<PropertyKey, never>
        Returns: {
          amenities: string[]
          bairro: string
          caracteristicas: string[]
          codigo_predio: string
          created_at: string
          endereco: string
          id: string
          image_urls: string[]
          imagem_2: string
          imagem_3: string
          imagem_4: string
          imagem_principal: string
          latitude: number
          longitude: number
          monthly_traffic: number
          nome: string
          numero_andares: number
          numero_blocos: number
          numero_elevadores: number
          numero_unidades: number
          padrao_publico: string
          preco_base: number
          publico_estimado: number
          quantidade_telas: number
          status: string
          venue_type: string
          visualizacoes_mes: number
        }[]
      }
      get_approvals_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          pago_pendente_video: number
          video_aprovado: number
          video_enviado: number
          video_rejeitado: number
        }[]
      }
      get_approved_videos_with_details: {
        Args: Record<PropertyKey, never>
        Returns: {
          approved_at: string
          approved_by: string
          approver_email: string
          approver_name: string
          client_email: string
          client_id: string
          client_name: string
          created_at: string
          data_fim: string
          data_inicio: string
          lista_paineis: string[]
          pedido_id: string
          pedido_video_id: string
          plano_meses: number
          slot_position: number
          valor_total: number
          video_id: string
          video_name: string
        }[]
      }
      get_building_contact_info: {
        Args: { building_id: string }
        Returns: {
          contato_sindico: string
          contato_vice_sindico: string
          id: string
          nome_contato_predio: string
          nome_sindico: string
          nome_vice_sindico: string
          numero_contato_predio: string
        }[]
      }
      get_building_names_public: {
        Args: { building_ids: string[] }
        Returns: {
          id: string
          nome: string
        }[]
      }
      get_buildings_current_video_count: {
        Args: { p_building_ids: string[] }
        Returns: {
          building_id: string
          current_videos_count: number
        }[]
      }
      get_buildings_for_authenticated_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          bairro: string
          id: string
          imagem_principal: string
          nome: string
          preco_base: number
          quantidade_telas: number
          status: string
          venue_type: string
        }[]
      }
      get_coupon_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          cupons_ativos: number
          cupons_expirados: number
          receita_com_desconto: number
          total_cupons: number
          total_usos: number
        }[]
      }
      get_coupon_usage_details: {
        Args: { cupom_id_param: string }
        Returns: {
          data_uso: string
          pedido_id: string
          user_email: string
          valor_desconto: number
          valor_pedido: number
        }[]
      }
      get_current_display_video: {
        Args: { p_pedido_id: string }
        Returns: {
          is_scheduled: boolean
          priority_type: string
          video_id: string
        }[]
      }
      get_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_dashboard_stats_by_month: {
        Args: { p_month: number; p_year: number }
        Returns: Json
      }
      get_last_12_months_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_monthly_comparison: {
        Args: { p_month: number; p_year: number }
        Returns: Json
      }
      get_paid_orders_without_video: {
        Args: Record<PropertyKey, never>
        Returns: {
          client_email: string
          client_id: string
          client_name: string
          created_at: string
          id: string
          lista_paineis: string[]
          plano_meses: number
          valor_total: number
        }[]
      }
      get_panel_credentials: {
        Args: { p_panel_id: string }
        Returns: {
          codigo_anydesk: string
          id: string
          ip_interno: string
          mac_address: string
          observacoes: string
          senha_anydesk: string
          versao_firmware: string
        }[]
      }
      get_panels_basic: {
        Args: Record<PropertyKey, never>
        Returns: {
          building_id: string
          code: string
          created_at: string
          id: string
          localizacao: string
          marca: string
          modelo: string
          orientacao: string
          polegada: string
          resolucao: string
          sistema_operacional: string
          status: string
          ultima_sync: string
        }[]
      }
      get_panels_by_location: {
        Args: { lat: number; lng: number; radius_meters: number }
        Returns: {
          building_id: string
          buildings: Json
          code: string
          id: string
          modo: string
          resolucao: string
          status: string
          ultima_sync: string
        }[]
      }
      get_pedidos_com_clientes: {
        Args: Record<PropertyKey, never>
        Returns: {
          client_email: string
          client_id: string
          client_name: string
          created_at: string
          data_fim: string
          data_inicio: string
          id: string
          lista_paineis: string[]
          plano_meses: number
          status: string
          valor_total: number
          video_status: string
        }[]
      }
      get_pending_approval_videos: {
        Args: Record<PropertyKey, never>
        Returns: {
          client_email: string
          client_name: string
          created_at: string
          id: string
          pedido_id: string
          pedido_valor: number
          slot_position: number
          video_duracao: number
          video_id: string
          video_nome: string
          video_orientacao: string
          video_url: string
        }[]
      }
      get_real_approval_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          approved: number
          paid_without_video: number
          pending_approval: number
          rejected: number
        }[]
      }
      get_real_revenue: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_recently_approved_videos: {
        Args: Record<PropertyKey, never>
        Returns: {
          approved_at: string
          client_email: string
          client_name: string
          id: string
          is_active: boolean
          pedido_id: string
          pedido_valor: number
          slot_position: number
          video_id: string
          video_nome: string
          video_url: string
        }[]
      }
      get_unread_notifications_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      investigate_missing_transaction: {
        Args: { p_amount: number; p_email: string }
        Returns: Json
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
          p_action_type: string
          p_building_id: string
          p_description: string
          p_new_values?: Json
          p_old_values?: Json
        }
        Returns: string
      }
      mark_notification_read: {
        Args: { notification_id: string }
        Returns: boolean
      }
      mercadopago_reconciliation_check: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      migrate_orphaned_payments: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      monitor_coupon_security: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      monitor_system_health: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      notify_contracts_expiring_soon: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      process_mercadopago_webhook: {
        Args: { webhook_data: Json }
        Returns: Json
      }
      process_mercadopago_webhook_enhanced: {
        Args: { p_payment_data: Json }
        Returns: Json
      }
      process_mercadopago_webhook_with_cleanup: {
        Args: { p_payment_data: Json }
        Returns: Json
      }
      recover_lost_transactions: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      register_payment_processing: {
        Args: {
          p_amount?: number
          p_details?: Json
          p_external_reference?: string
          p_payment_id: string
          p_pedido_id: string
        }
        Returns: string
      }
      reject_video: {
        Args: {
          p_approved_by: string
          p_pedido_video_id: string
          p_rejection_reason: string
        }
        Returns: boolean
      }
      resolve_email_conflicts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      revert_suspicious_payment: {
        Args: { p_pedido_id: string; p_reason?: string }
        Returns: Json
      }
      safe_create_admin_user: {
        Args: { p_email: string; p_password?: string; p_role: string }
        Returns: Json
      }
      select_video_for_display: {
        Args: { p_pedido_video_id: string }
        Returns: boolean
      }
      set_base_video: {
        Args: { p_pedido_video_id: string }
        Returns: boolean
      }
      set_base_video_enhanced: {
        Args: { p_pedido_video_id: string }
        Returns: Json
      }
      submit_lead_produtora: {
        Args: {
          p_agendar_cafe?: boolean
          p_email: string
          p_empresa?: string
          p_nome: string
          p_objetivo?: string
          p_tipo_video?: string
          p_whatsapp: string
        }
        Returns: Json
      }
      switch_video_selection: {
        Args: { p_pedido_video_id: string }
        Returns: boolean
      }
      update_expired_contracts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      update_expired_contracts_daily: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      update_panel_secure: {
        Args: { p_panel_id: string; p_updates: Json }
        Returns: Json
      }
      validate_coupon_secure: {
        Args: { p_codigo: string; p_valor_pedido?: number }
        Returns: Json
      }
      validate_cupom: {
        Args: { p_codigo: string; p_meses: number }
        Returns: {
          codigo: string
          desconto_percentual: number
          id: string
          message: string
          valid: boolean
        }[]
      }
      validate_developer_token: {
        Args: { p_token: string }
        Returns: boolean
      }
      validate_price_integrity: {
        Args: { p_expected_price: number; p_transaction_id: string }
        Returns: boolean
      }
      validate_video_specs: {
        Args: {
          p_altura?: number
          p_duracao: number
          p_largura?: number
          p_orientacao: string
          p_tem_audio: boolean
        }
        Returns: {
          errors: string[]
          valid: boolean
        }[]
      }
      validate_video_upload_permission: {
        Args: { p_pedido_id: string }
        Returns: boolean
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
