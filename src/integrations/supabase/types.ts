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
      active_sessions_monitor: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          device_type: string | null
          ended_at: string | null
          id: string
          ip_address: string
          is_active: boolean | null
          last_activity: string | null
          os: string | null
          session_token: string
          started_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          ended_at?: string | null
          id?: string
          ip_address: string
          is_active?: boolean | null
          last_activity?: string | null
          os?: string | null
          session_token: string
          started_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          ended_at?: string | null
          id?: string
          ip_address?: string
          is_active?: boolean | null
          last_activity?: string | null
          os?: string | null
          session_token?: string
          started_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "active_sessions_monitor_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_sessions_monitor_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_context: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      agent_knowledge_items: {
        Row: {
          active: boolean | null
          agent_id: string
          content: string
          content_type: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          instruction: string | null
          keywords: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          agent_id: string
          content: string
          content_type: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          instruction?: string | null
          keywords?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          agent_id?: string
          content?: string
          content_type?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          instruction?: string | null
          keywords?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      agent_logs: {
        Row: {
          agent_key: string
          conversation_id: string | null
          created_at: string
          event_type: string
          id: string
          message_id: string | null
          metadata: Json | null
          rule_used: string | null
        }
        Insert: {
          agent_key: string
          conversation_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          message_id?: string | null
          metadata?: Json | null
          rule_used?: string | null
        }
        Update: {
          agent_key?: string
          conversation_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          message_id?: string | null
          metadata?: Json | null
          rule_used?: string | null
        }
        Relationships: []
      }
      agent_modification_logs: {
        Row: {
          agent_key: string
          created_at: string | null
          field_modified: string
          id: string
          modified_by: string | null
          new_value: string | null
          old_value: string | null
          section: string
        }
        Insert: {
          agent_key: string
          created_at?: string | null
          field_modified: string
          id?: string
          modified_by?: string | null
          new_value?: string | null
          old_value?: string | null
          section: string
        }
        Update: {
          agent_key?: string
          created_at?: string | null
          field_modified?: string
          id?: string
          modified_by?: string | null
          new_value?: string | null
          old_value?: string | null
          section?: string
        }
        Relationships: []
      }
      agent_performance_metrics: {
        Row: {
          agent_key: string
          duration_ms: number | null
          error_code: string | null
          id: string
          metadata: Json | null
          metric_type: string
          model: string | null
          timestamp: string | null
          tokens_used: number | null
        }
        Insert: {
          agent_key: string
          duration_ms?: number | null
          error_code?: string | null
          id?: string
          metadata?: Json | null
          metric_type: string
          model?: string | null
          timestamp?: string | null
          tokens_used?: number | null
        }
        Update: {
          agent_key?: string
          duration_ms?: number | null
          error_code?: string | null
          id?: string
          metadata?: Json | null
          metric_type?: string
          model?: string | null
          timestamp?: string | null
          tokens_used?: number | null
        }
        Relationships: []
      }
      agent_preview_conversations: {
        Row: {
          agent_key: string
          created_at: string | null
          id: string
          messages: Json
        }
        Insert: {
          agent_key: string
          created_at?: string | null
          id?: string
          messages: Json
        }
        Update: {
          agent_key?: string
          created_at?: string | null
          id?: string
          messages?: Json
        }
        Relationships: []
      }
      agent_sections: {
        Row: {
          agent_id: string
          content: string
          created_at: string | null
          id: string
          section_number: number
          section_title: string
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          content: string
          created_at?: string | null
          id?: string
          section_number: number
          section_title: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          content?: string
          created_at?: string | null
          id?: string
          section_number?: number
          section_title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      agent_topics: {
        Row: {
          agent_key: string
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          keywords: string[]
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          agent_key: string
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[]
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          agent_key?: string
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[]
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      agents: {
        Row: {
          ai_auto_response: boolean | null
          created_at: string
          description: string
          display_name: string
          id: string
          is_active: boolean | null
          kb_ids: Json | null
          key: string
          manychat_config: Json | null
          openai_config: Json | null
          routing_rules: Json | null
          type: string
          updated_at: string
          vision_enabled: boolean | null
          whatsapp_number: string | null
          whatsapp_provider: string | null
          zapi_config: Json | null
        }
        Insert: {
          ai_auto_response?: boolean | null
          created_at?: string
          description: string
          display_name: string
          id?: string
          is_active?: boolean | null
          kb_ids?: Json | null
          key: string
          manychat_config?: Json | null
          openai_config?: Json | null
          routing_rules?: Json | null
          type: string
          updated_at?: string
          vision_enabled?: boolean | null
          whatsapp_number?: string | null
          whatsapp_provider?: string | null
          zapi_config?: Json | null
        }
        Update: {
          ai_auto_response?: boolean | null
          created_at?: string
          description?: string
          display_name?: string
          id?: string
          is_active?: boolean | null
          kb_ids?: Json | null
          key?: string
          manychat_config?: Json | null
          openai_config?: Json | null
          routing_rules?: Json | null
          type?: string
          updated_at?: string
          vision_enabled?: boolean | null
          whatsapp_number?: string | null
          whatsapp_provider?: string | null
          zapi_config?: Json | null
        }
        Relationships: []
      }
      ai_debug_analysis_history: {
        Row: {
          ai_analysis: Json
          ai_model: string | null
          analysis_duration_ms: number | null
          analyzed_components: Json | null
          analyzed_hooks: Json | null
          analyzed_services: Json | null
          browser_info: Json | null
          console_logs: Json | null
          created_at: string | null
          detected_errors: Json | null
          error_count: number | null
          error_message: string | null
          error_severity: string | null
          id: string
          network_calls: Json | null
          page_path: string
          page_state_snapshot: Json | null
          page_url: string
          performance_metrics: Json | null
          quick_fixes: Json | null
          screen_resolution: string | null
          status: string | null
          suggestions: Json | null
          tokens_used: number | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          ai_analysis: Json
          ai_model?: string | null
          analysis_duration_ms?: number | null
          analyzed_components?: Json | null
          analyzed_hooks?: Json | null
          analyzed_services?: Json | null
          browser_info?: Json | null
          console_logs?: Json | null
          created_at?: string | null
          detected_errors?: Json | null
          error_count?: number | null
          error_message?: string | null
          error_severity?: string | null
          id?: string
          network_calls?: Json | null
          page_path: string
          page_state_snapshot?: Json | null
          page_url: string
          performance_metrics?: Json | null
          quick_fixes?: Json | null
          screen_resolution?: string | null
          status?: string | null
          suggestions?: Json | null
          tokens_used?: number | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          ai_analysis?: Json
          ai_model?: string | null
          analysis_duration_ms?: number | null
          analyzed_components?: Json | null
          analyzed_hooks?: Json | null
          analyzed_services?: Json | null
          browser_info?: Json | null
          console_logs?: Json | null
          created_at?: string | null
          detected_errors?: Json | null
          error_count?: number | null
          error_message?: string | null
          error_severity?: string | null
          id?: string
          network_calls?: Json | null
          page_path?: string
          page_state_snapshot?: Json | null
          page_url?: string
          performance_metrics?: Json | null
          quick_fixes?: Json | null
          screen_resolution?: string | null
          status?: string | null
          suggestions?: Json | null
          tokens_used?: number | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_reports_log: {
        Row: {
          ai_insights: Json | null
          created_at: string
          file_size_kb: number | null
          generated_by: string | null
          generation_time_ms: number | null
          id: string
          metrics: Json | null
          period_end: string
          period_start: string
          report_type: string
          total_conversations: number
          total_messages: number
        }
        Insert: {
          ai_insights?: Json | null
          created_at?: string
          file_size_kb?: number | null
          generated_by?: string | null
          generation_time_ms?: number | null
          id?: string
          metrics?: Json | null
          period_end: string
          period_start: string
          report_type?: string
          total_conversations?: number
          total_messages?: number
        }
        Update: {
          ai_insights?: Json | null
          created_at?: string
          file_size_kb?: number | null
          generated_by?: string | null
          generation_time_ms?: number | null
          id?: string
          metrics?: Json | null
          period_end?: string
          period_start?: string
          report_type?: string
          total_conversations?: number
          total_messages?: number
        }
        Relationships: []
      }
      analyses: {
        Row: {
          analysis_at: string | null
          conversation_id: string
          id: string
          intent: string | null
          opportunity: boolean | null
          raw_payload: Json | null
          response_quality_score: number | null
          sla_violations: Json | null
          suggested_reply: string | null
          summary: string | null
        }
        Insert: {
          analysis_at?: string | null
          conversation_id: string
          id?: string
          intent?: string | null
          opportunity?: boolean | null
          raw_payload?: Json | null
          response_quality_score?: number | null
          sla_violations?: Json | null
          suggested_reply?: string | null
          summary?: string | null
        }
        Update: {
          analysis_at?: string | null
          conversation_id?: string
          id?: string
          intent?: string | null
          opportunity?: boolean | null
          raw_payload?: Json | null
          response_quality_score?: number | null
          sla_violations?: Json | null
          suggested_reply?: string | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analyses_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_logs: {
        Row: {
          api_name: string
          created_at: string | null
          endpoint: string
          error_message: string | null
          id: string
          request_payload: Json | null
          response_data: Json | null
          response_time_ms: number | null
          status_code: number | null
          success: boolean
        }
        Insert: {
          api_name: string
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          id?: string
          request_payload?: Json | null
          response_data?: Json | null
          response_time_ms?: number | null
          status_code?: number | null
          success?: boolean
        }
        Update: {
          api_name?: string
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          id?: string
          request_payload?: Json | null
          response_data?: Json | null
          response_time_ms?: number | null
          status_code?: number | null
          success?: boolean
        }
        Relationships: []
      }
      api_rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          identifier: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          identifier: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      auth_detailed_logs: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          email: string
          event_type: string
          failure_reason: string | null
          id: string
          ip_address: string
          os: string | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          email: string
          event_type: string
          failure_reason?: string | null
          id?: string
          ip_address: string
          os?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          email?: string
          event_type?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string
          os?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auth_detailed_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auth_detailed_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      available_benefits: {
        Row: {
          category: string
          created_at: string
          delivery_days: number
          icon: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          subtitle: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          delivery_days?: number
          icon: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          subtitle?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          delivery_days?: number
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          subtitle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      blocked_ips: {
        Row: {
          blocked_at: string | null
          blocked_by: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          ip_address: string
          is_active: boolean | null
          metadata: Json | null
          reason: string | null
        }
        Insert: {
          blocked_at?: string | null
          blocked_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address: string
          is_active?: boolean | null
          metadata?: Json | null
          reason?: string | null
        }
        Update: {
          blocked_at?: string | null
          blocked_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string
          is_active?: boolean | null
          metadata?: Json | null
          reason?: string | null
        }
        Relationships: []
      }
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
      building_notices: {
        Row: {
          background_color: string | null
          building_id: string
          content: string
          created_at: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          text_color: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          background_color?: string | null
          building_id: string
          content: string
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          text_color?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          background_color?: string | null
          building_id?: string
          content?: string
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          text_color?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "building_notices_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "fk_campaign_video_schedules_campaign"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns_advanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_campaign_video_schedules_video"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
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
            foreignKeyName: "campanhas_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users_with_role"
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
      client_activity_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_activity_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_activity_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      client_behavior_analytics: {
        Row: {
          ai_behavior_summary: string | null
          ai_interest_level: string | null
          ai_recommended_actions: Json | null
          avg_time_per_building: number | null
          buildings_in_cart: Json | null
          buildings_viewed: Json | null
          cart_abandonments: number | null
          checkout_starts: number | null
          created_at: string
          days_until_renewal: number | null
          device_type: string | null
          has_active_plan: boolean | null
          id: string
          last_ai_analysis: string | null
          last_platform_activity: string | null
          last_visit: string | null
          lifecycle_stage: string | null
          most_viewed_building_id: string | null
          pages_visited: Json | null
          plan_end_date: string | null
          platform_usage_score: number | null
          purchase_intent_score: number | null
          session_id: string | null
          total_platform_logins: number | null
          total_sessions: number | null
          total_time_spent: number | null
          total_video_time: number | null
          total_videos_managed: number | null
          updated_at: string
          user_id: string
          video_completion_rate: number | null
          videos_watched: Json | null
        }
        Insert: {
          ai_behavior_summary?: string | null
          ai_interest_level?: string | null
          ai_recommended_actions?: Json | null
          avg_time_per_building?: number | null
          buildings_in_cart?: Json | null
          buildings_viewed?: Json | null
          cart_abandonments?: number | null
          checkout_starts?: number | null
          created_at?: string
          days_until_renewal?: number | null
          device_type?: string | null
          has_active_plan?: boolean | null
          id?: string
          last_ai_analysis?: string | null
          last_platform_activity?: string | null
          last_visit?: string | null
          lifecycle_stage?: string | null
          most_viewed_building_id?: string | null
          pages_visited?: Json | null
          plan_end_date?: string | null
          platform_usage_score?: number | null
          purchase_intent_score?: number | null
          session_id?: string | null
          total_platform_logins?: number | null
          total_sessions?: number | null
          total_time_spent?: number | null
          total_video_time?: number | null
          total_videos_managed?: number | null
          updated_at?: string
          user_id: string
          video_completion_rate?: number | null
          videos_watched?: Json | null
        }
        Update: {
          ai_behavior_summary?: string | null
          ai_interest_level?: string | null
          ai_recommended_actions?: Json | null
          avg_time_per_building?: number | null
          buildings_in_cart?: Json | null
          buildings_viewed?: Json | null
          cart_abandonments?: number | null
          checkout_starts?: number | null
          created_at?: string
          days_until_renewal?: number | null
          device_type?: string | null
          has_active_plan?: boolean | null
          id?: string
          last_ai_analysis?: string | null
          last_platform_activity?: string | null
          last_visit?: string | null
          lifecycle_stage?: string | null
          most_viewed_building_id?: string | null
          pages_visited?: Json | null
          plan_end_date?: string | null
          platform_usage_score?: number | null
          purchase_intent_score?: number | null
          session_id?: string | null
          total_platform_logins?: number | null
          total_sessions?: number | null
          total_time_spent?: number | null
          total_video_time?: number | null
          total_videos_managed?: number | null
          updated_at?: string
          user_id?: string
          video_completion_rate?: number | null
          videos_watched?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "client_behavior_analytics_most_viewed_building_id_fkey"
            columns: ["most_viewed_building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      client_crm_notes: {
        Row: {
          client_id: string
          content: string
          created_at: string
          created_by: string
          id: string
          is_important: boolean | null
          note_type: string
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string
          created_by: string
          id?: string
          is_important?: boolean | null
          note_type: string
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_important?: boolean | null
          note_type?: string
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
      client_platform_activity: {
        Row: {
          active_orders_count: number | null
          active_orders_views: number | null
          created_at: string | null
          days_until_renewal: number | null
          id: string
          last_login: string | null
          last_order_view: string | null
          last_video_upload: string | null
          login_frequency: number | null
          nearest_renewal_date: string | null
          platform_engagement_score: number | null
          renewal_notifications_sent: number | null
          total_logins: number | null
          total_videos_swapped: number | null
          total_videos_uploaded: number | null
          updated_at: string | null
          user_id: string
          videos_approved: number | null
          videos_pending_approval: number | null
          videos_rejected: number | null
        }
        Insert: {
          active_orders_count?: number | null
          active_orders_views?: number | null
          created_at?: string | null
          days_until_renewal?: number | null
          id?: string
          last_login?: string | null
          last_order_view?: string | null
          last_video_upload?: string | null
          login_frequency?: number | null
          nearest_renewal_date?: string | null
          platform_engagement_score?: number | null
          renewal_notifications_sent?: number | null
          total_logins?: number | null
          total_videos_swapped?: number | null
          total_videos_uploaded?: number | null
          updated_at?: string | null
          user_id: string
          videos_approved?: number | null
          videos_pending_approval?: number | null
          videos_rejected?: number | null
        }
        Update: {
          active_orders_count?: number | null
          active_orders_views?: number | null
          created_at?: string | null
          days_until_renewal?: number | null
          id?: string
          last_login?: string | null
          last_order_view?: string | null
          last_video_upload?: string | null
          login_frequency?: number | null
          nearest_renewal_date?: string | null
          platform_engagement_score?: number | null
          renewal_notifications_sent?: number | null
          total_logins?: number | null
          total_videos_swapped?: number | null
          total_videos_uploaded?: number | null
          updated_at?: string | null
          user_id?: string
          videos_approved?: number | null
          videos_pending_approval?: number | null
          videos_rejected?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_platform_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_platform_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_adicionais: {
        Row: {
          backup_automatico_ativo: boolean | null
          backup_frequencia: string | null
          backup_retencao_dias: number | null
          contato_email: string | null
          contato_telefone: string | null
          contato_whatsapp: string | null
          created_at: string
          email_footer_texto: string | null
          email_remetente_email: string | null
          email_remetente_nome: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_complemento: string | null
          endereco_estado: string | null
          endereco_numero: string | null
          endereco_rua: string | null
          facebook_pixel_id: string | null
          google_analytics_id: string | null
          google_tag_manager_id: string | null
          id: string
          limite_pedidos_simultaneos: number | null
          limite_tamanho_video_mb: number | null
          limite_videos_por_cliente: number | null
          manutencao_mensagem: string | null
          modo_demonstracao: boolean | null
          mostrar_precos: boolean | null
          notificacoes_admin_email: string | null
          notificacoes_clientes_novos: boolean | null
          notificacoes_email_ativas: boolean | null
          notificacoes_pagamentos: boolean | null
          notificacoes_pedidos_novos: boolean | null
          permitir_registro_publico: boolean | null
          politica_cookies_url: string | null
          politica_privacidade_url: string | null
          seguranca_ip_whitelist: string[] | null
          seguranca_max_tentativas_login: number | null
          seguranca_sessao_timeout_minutos: number | null
          seguranca_tempo_bloqueio_minutos: number | null
          seo_description: string | null
          seo_keywords: string | null
          site_descricao: string | null
          site_favicon_url: string | null
          site_logo_url: string | null
          site_nome: string | null
          site_slogan: string | null
          social_facebook: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_twitter: string | null
          social_youtube: string | null
          suporte_email: string | null
          suporte_horario: string | null
          termos_uso_url: string | null
          updated_at: string
        }
        Insert: {
          backup_automatico_ativo?: boolean | null
          backup_frequencia?: string | null
          backup_retencao_dias?: number | null
          contato_email?: string | null
          contato_telefone?: string | null
          contato_whatsapp?: string | null
          created_at?: string
          email_footer_texto?: string | null
          email_remetente_email?: string | null
          email_remetente_nome?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_estado?: string | null
          endereco_numero?: string | null
          endereco_rua?: string | null
          facebook_pixel_id?: string | null
          google_analytics_id?: string | null
          google_tag_manager_id?: string | null
          id?: string
          limite_pedidos_simultaneos?: number | null
          limite_tamanho_video_mb?: number | null
          limite_videos_por_cliente?: number | null
          manutencao_mensagem?: string | null
          modo_demonstracao?: boolean | null
          mostrar_precos?: boolean | null
          notificacoes_admin_email?: string | null
          notificacoes_clientes_novos?: boolean | null
          notificacoes_email_ativas?: boolean | null
          notificacoes_pagamentos?: boolean | null
          notificacoes_pedidos_novos?: boolean | null
          permitir_registro_publico?: boolean | null
          politica_cookies_url?: string | null
          politica_privacidade_url?: string | null
          seguranca_ip_whitelist?: string[] | null
          seguranca_max_tentativas_login?: number | null
          seguranca_sessao_timeout_minutos?: number | null
          seguranca_tempo_bloqueio_minutos?: number | null
          seo_description?: string | null
          seo_keywords?: string | null
          site_descricao?: string | null
          site_favicon_url?: string | null
          site_logo_url?: string | null
          site_nome?: string | null
          site_slogan?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          social_youtube?: string | null
          suporte_email?: string | null
          suporte_horario?: string | null
          termos_uso_url?: string | null
          updated_at?: string
        }
        Update: {
          backup_automatico_ativo?: boolean | null
          backup_frequencia?: string | null
          backup_retencao_dias?: number | null
          contato_email?: string | null
          contato_telefone?: string | null
          contato_whatsapp?: string | null
          created_at?: string
          email_footer_texto?: string | null
          email_remetente_email?: string | null
          email_remetente_nome?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_estado?: string | null
          endereco_numero?: string | null
          endereco_rua?: string | null
          facebook_pixel_id?: string | null
          google_analytics_id?: string | null
          google_tag_manager_id?: string | null
          id?: string
          limite_pedidos_simultaneos?: number | null
          limite_tamanho_video_mb?: number | null
          limite_videos_por_cliente?: number | null
          manutencao_mensagem?: string | null
          modo_demonstracao?: boolean | null
          mostrar_precos?: boolean | null
          notificacoes_admin_email?: string | null
          notificacoes_clientes_novos?: boolean | null
          notificacoes_email_ativas?: boolean | null
          notificacoes_pagamentos?: boolean | null
          notificacoes_pedidos_novos?: boolean | null
          permitir_registro_publico?: boolean | null
          politica_cookies_url?: string | null
          politica_privacidade_url?: string | null
          seguranca_ip_whitelist?: string[] | null
          seguranca_max_tentativas_login?: number | null
          seguranca_sessao_timeout_minutos?: number | null
          seguranca_tempo_bloqueio_minutos?: number | null
          seo_description?: string | null
          seo_keywords?: string | null
          site_descricao?: string | null
          site_favicon_url?: string | null
          site_logo_url?: string | null
          site_nome?: string | null
          site_slogan?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          social_youtube?: string | null
          suporte_email?: string | null
          suporte_horario?: string | null
          termos_uso_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      configuracoes_sindico: {
        Row: {
          condominio_ticker_names: string[] | null
          created_at: string | null
          id: string
          updated_at: string | null
          video_homepage_url: string | null
          video_principal_url: string | null
          video_secundario_url: string | null
        }
        Insert: {
          condominio_ticker_names?: string[] | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          video_homepage_url?: string | null
          video_principal_url?: string | null
          video_secundario_url?: string | null
        }
        Update: {
          condominio_ticker_names?: string[] | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          video_homepage_url?: string | null
          video_principal_url?: string | null
          video_secundario_url?: string | null
        }
        Relationships: []
      }
      configuracoes_sistema: {
        Row: {
          created_at: string | null
          debug_ai_activated_at: string | null
          debug_ai_activated_by: string | null
          debug_ai_enabled: boolean | null
          id: string
          modo_emergencia: boolean
          seed_hash: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          debug_ai_activated_at?: string | null
          debug_ai_activated_by?: string | null
          debug_ai_enabled?: boolean | null
          id?: string
          modo_emergencia?: boolean
          seed_hash: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          debug_ai_activated_at?: string | null
          debug_ai_activated_by?: string | null
          debug_ai_enabled?: boolean | null
          id?: string
          modo_emergencia?: boolean
          seed_hash?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      connection_history: {
        Row: {
          computer_id: string
          created_at: string | null
          duration_seconds: number | null
          ended_at: string | null
          event_type: string
          id: string
          started_at: string
        }
        Insert: {
          computer_id: string
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          event_type: string
          id?: string
          started_at?: string
        }
        Update: {
          computer_id?: string
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          event_type?: string
          id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_history_computer_id_fkey"
            columns: ["computer_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_types: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          label: string
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          label: string
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          label?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contratos: {
        Row: {
          created_at: string
          data_fim: string
          data_inicio: string
          id: string
          painel_id: string
          pedido_id: string
          plano_meses: number
          predio_id: string | null
          status: string
          updated_at: string
          user_id: string
          valor_mensal: number
          valor_total: number
        }
        Insert: {
          created_at?: string
          data_fim: string
          data_inicio: string
          id?: string
          painel_id: string
          pedido_id: string
          plano_meses: number
          predio_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
          valor_mensal?: number
          valor_total?: number
        }
        Update: {
          created_at?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          painel_id?: string
          pedido_id?: string
          plano_meses?: number
          predio_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          valor_mensal?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "contratos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_analytics: {
        Row: {
          agent_key: string
          conversation_id: string | null
          conversion_type: string | null
          converted: boolean | null
          converted_at: string | null
          created_at: string | null
          id: string
          interest_level: string | null
          lead_qualified: boolean | null
          lead_score: number | null
          lead_type: string | null
          message_count: number | null
          phone_number: string
          response_time_avg_ms: number | null
          session_duration_seconds: number | null
          session_end: string | null
          session_start: string | null
          updated_at: string | null
          user_initiated: boolean | null
        }
        Insert: {
          agent_key: string
          conversation_id?: string | null
          conversion_type?: string | null
          converted?: boolean | null
          converted_at?: string | null
          created_at?: string | null
          id?: string
          interest_level?: string | null
          lead_qualified?: boolean | null
          lead_score?: number | null
          lead_type?: string | null
          message_count?: number | null
          phone_number: string
          response_time_avg_ms?: number | null
          session_duration_seconds?: number | null
          session_end?: string | null
          session_start?: string | null
          updated_at?: string | null
          user_initiated?: boolean | null
        }
        Update: {
          agent_key?: string
          conversation_id?: string | null
          conversion_type?: string | null
          converted?: boolean | null
          converted_at?: string | null
          created_at?: string | null
          id?: string
          interest_level?: string | null
          lead_qualified?: boolean | null
          lead_score?: number | null
          lead_type?: string | null
          message_count?: number | null
          phone_number?: string
          response_time_avg_ms?: number | null
          session_duration_seconds?: number | null
          session_end?: string | null
          session_start?: string | null
          updated_at?: string | null
          user_initiated?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_analytics_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_buildings: {
        Row: {
          building_id: string
          conversation_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          updated_at: string | null
        }
        Insert: {
          building_id: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          updated_at?: string | null
        }
        Update: {
          building_id?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_buildings_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_buildings_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_events: {
        Row: {
          conversation_id: string
          created_at: string | null
          details: Json | null
          event_type: string
          from_agent: string | null
          id: string
          severity: string | null
          to_agent: string | null
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          details?: Json | null
          event_type: string
          from_agent?: string | null
          id?: string
          severity?: string | null
          to_agent?: string | null
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          details?: Json | null
          event_type?: string
          from_agent?: string | null
          id?: string
          severity?: string | null
          to_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_notes: {
        Row: {
          agent_key: string
          created_at: string | null
          created_by: string | null
          id: string
          note_text: string
          phone_number: string
          updated_at: string | null
        }
        Insert: {
          agent_key: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          note_text: string
          phone_number: string
          updated_at?: string | null
        }
        Update: {
          agent_key?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          note_text?: string
          phone_number?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      conversation_reports: {
        Row: {
          agent_key: string
          contact_profile: Json | null
          conversation_id: string | null
          conversation_stage: string | null
          created_at: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          interests: Json | null
          recommendations: Json | null
          report_data: Json
          summary: string | null
        }
        Insert: {
          agent_key: string
          contact_profile?: Json | null
          conversation_id?: string | null
          conversation_stage?: string | null
          created_at?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          interests?: Json | null
          recommendations?: Json | null
          report_data: Json
          summary?: string | null
        }
        Update: {
          agent_key?: string
          contact_profile?: Json | null
          conversation_id?: string | null
          conversation_stage?: string | null
          created_at?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          interests?: Json | null
          recommendations?: Json | null
          report_data?: Json
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_reports_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_tag_assignments: {
        Row: {
          agent_key: string
          created_at: string | null
          id: string
          phone_number: string
          tag_id: string | null
        }
        Insert: {
          agent_key: string
          created_at?: string | null
          id?: string
          phone_number: string
          tag_id?: string | null
        }
        Update: {
          agent_key?: string
          created_at?: string | null
          id?: string
          phone_number?: string
          tag_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "conversation_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_tags: {
        Row: {
          color: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          color: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          agent_key: string | null
          alerted_exa: boolean | null
          avg_response_time: unknown
          awaiting_response: boolean | null
          contact_name: string | null
          contact_phone: string
          contact_type: string | null
          contact_type_source: string | null
          contact_type_updated_at: string | null
          contact_type_updated_by: string | null
          created_at: string | null
          escalated_at: string | null
          escalated_to_eduardo: boolean | null
          external_id: string | null
          first_message_at: string | null
          id: string
          is_critical: boolean | null
          is_group: boolean | null
          is_hot_lead: boolean | null
          is_muted: boolean | null
          is_sindico: boolean | null
          last_message_at: string | null
          last_response_time: unknown
          lead_score: number | null
          metadata: Json | null
          mood_score: number | null
          provider: string | null
          reported_to_iris: boolean | null
          sentiment: string | null
          sofia_paused: boolean | null
          status: string | null
          urgency_level: number | null
        }
        Insert: {
          agent_key?: string | null
          alerted_exa?: boolean | null
          avg_response_time?: unknown
          awaiting_response?: boolean | null
          contact_name?: string | null
          contact_phone: string
          contact_type?: string | null
          contact_type_source?: string | null
          contact_type_updated_at?: string | null
          contact_type_updated_by?: string | null
          created_at?: string | null
          escalated_at?: string | null
          escalated_to_eduardo?: boolean | null
          external_id?: string | null
          first_message_at?: string | null
          id?: string
          is_critical?: boolean | null
          is_group?: boolean | null
          is_hot_lead?: boolean | null
          is_muted?: boolean | null
          is_sindico?: boolean | null
          last_message_at?: string | null
          last_response_time?: unknown
          lead_score?: number | null
          metadata?: Json | null
          mood_score?: number | null
          provider?: string | null
          reported_to_iris?: boolean | null
          sentiment?: string | null
          sofia_paused?: boolean | null
          status?: string | null
          urgency_level?: number | null
        }
        Update: {
          agent_key?: string | null
          alerted_exa?: boolean | null
          avg_response_time?: unknown
          awaiting_response?: boolean | null
          contact_name?: string | null
          contact_phone?: string
          contact_type?: string | null
          contact_type_source?: string | null
          contact_type_updated_at?: string | null
          contact_type_updated_by?: string | null
          created_at?: string | null
          escalated_at?: string | null
          escalated_to_eduardo?: boolean | null
          external_id?: string | null
          first_message_at?: string | null
          id?: string
          is_critical?: boolean | null
          is_group?: boolean | null
          is_hot_lead?: boolean | null
          is_muted?: boolean | null
          is_sindico?: boolean | null
          last_message_at?: string | null
          last_response_time?: unknown
          lead_score?: number | null
          metadata?: Json | null
          mood_score?: number | null
          provider?: string | null
          reported_to_iris?: boolean | null
          sentiment?: string | null
          sofia_paused?: boolean | null
          status?: string | null
          urgency_level?: number | null
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
      crm_action_logs: {
        Row: {
          action_details: Json | null
          action_type: string
          client_id: string
          created_at: string | null
          id: string
          ip_address: string | null
          performed_by: string
          user_agent: string | null
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          client_id: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          performed_by: string
          user_agent?: string | null
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          client_id?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          performed_by?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_action_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_action_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_action_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_action_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_ai_analysis_history: {
        Row: {
          analysis_data: Json
          analyzed_by: string | null
          churn_risk: string
          conversion_probability: string
          created_at: string | null
          id: string
          interest_level: string
          interest_score: number
          ip_address: string | null
          recommended_actions: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          analysis_data: Json
          analyzed_by?: string | null
          churn_risk: string
          conversion_probability: string
          created_at?: string | null
          id?: string
          interest_level: string
          interest_score: number
          ip_address?: string | null
          recommended_actions?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          analysis_data?: Json
          analyzed_by?: string | null
          churn_risk?: string
          conversion_probability?: string
          created_at?: string | null
          id?: string
          interest_level?: string
          interest_score?: number
          ip_address?: string | null
          recommended_actions?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_ai_analysis_history_analyzed_by_fkey"
            columns: ["analyzed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_ai_analysis_history_analyzed_by_fkey"
            columns: ["analyzed_by"]
            isOneToOne: false
            referencedRelation: "users_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_ai_analysis_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_ai_analysis_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_job_logs: {
        Row: {
          details: Json | null
          executed_at: string | null
          id: string
          job_name: string
          status: string | null
        }
        Insert: {
          details?: Json | null
          executed_at?: string | null
          id?: string
          job_name: string
          status?: string | null
        }
        Update: {
          details?: Json | null
          executed_at?: string | null
          id?: string
          job_name?: string
          status?: string | null
        }
        Relationships: []
      }
      cupom_aplicacoes: {
        Row: {
          aplicado_em: string
          created_at: string
          cupom_id: string
          finalizado: boolean | null
          id: string
          lista_predios: string[] | null
          pedido_id: string | null
          plano_meses: number | null
          quantidade_predios: number | null
          user_id: string
          valor_pedido_estimado: number | null
        }
        Insert: {
          aplicado_em?: string
          created_at?: string
          cupom_id: string
          finalizado?: boolean | null
          id?: string
          lista_predios?: string[] | null
          pedido_id?: string | null
          plano_meses?: number | null
          quantidade_predios?: number | null
          user_id: string
          valor_pedido_estimado?: number | null
        }
        Update: {
          aplicado_em?: string
          created_at?: string
          cupom_id?: string
          finalizado?: boolean | null
          id?: string
          lista_predios?: string[] | null
          pedido_id?: string | null
          plano_meses?: number | null
          quantidade_predios?: number | null
          user_id?: string
          valor_pedido_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cupom_aplicacoes_cupom_id_fkey"
            columns: ["cupom_id"]
            isOneToOne: false
            referencedRelation: "cupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cupom_aplicacoes_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
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
          max_predios: number | null
          max_usos: number
          min_meses: number
          min_predios: number | null
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
          max_predios?: number | null
          max_usos?: number
          min_meses?: number
          min_predios?: number | null
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
          max_predios?: number | null
          max_usos?: number
          min_meses?: number
          min_predios?: number | null
          tipo_desconto?: string | null
          uso_por_usuario?: number | null
          usos_atuais?: number
          valor_minimo_pedido?: number | null
        }
        Relationships: []
      }
      daily_report_config: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          recipient_emails: string[] | null
          schedule_time: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          recipient_emails?: string[] | null
          schedule_time?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          recipient_emails?: string[] | null
          schedule_time?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_reports: {
        Row: {
          agent_key: string
          ai_analysis: Json
          created_at: string | null
          id: string
          metrics: Json
          pdf_url: string | null
          report_date: string
          sent_to: string[] | null
        }
        Insert: {
          agent_key?: string
          ai_analysis: Json
          created_at?: string | null
          id?: string
          metrics: Json
          pdf_url?: string | null
          report_date: string
          sent_to?: string[] | null
        }
        Update: {
          agent_key?: string
          ai_analysis?: Json
          created_at?: string | null
          id?: string
          metrics?: Json
          pdf_url?: string | null
          report_date?: string
          sent_to?: string[] | null
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
      device_alert_configs: {
        Row: {
          alerts_enabled: boolean | null
          created_at: string | null
          device_id: string
          id: string
          offline_threshold_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          alerts_enabled?: boolean | null
          created_at?: string | null
          device_id: string
          id?: string
          offline_threshold_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          alerts_enabled?: boolean | null
          created_at?: string | null
          device_id?: string
          id?: string
          offline_threshold_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_alert_configs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: true
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      device_alerts: {
        Row: {
          alert_type: string
          closed_at: string | null
          created_at: string | null
          device_id: string
          evidence: Json | null
          id: string
          opened_at: string | null
          severity: string | null
          status: string | null
        }
        Insert: {
          alert_type: string
          closed_at?: string | null
          created_at?: string | null
          device_id: string
          evidence?: Json | null
          id?: string
          opened_at?: string | null
          severity?: string | null
          status?: string | null
        }
        Update: {
          alert_type?: string
          closed_at?: string | null
          created_at?: string | null
          device_id?: string
          evidence?: Json | null
          id?: string
          opened_at?: string | null
          severity?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_alerts_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          address: string | null
          anydesk_client_id: string
          comments: string | null
          condominio_name: string
          consecutive_offline_count: number
          created_at: string | null
          id: string
          is_active: boolean | null
          last_online_at: string | null
          metadata: Json | null
          name: string
          offline_count: number | null
          provider: string | null
          status: string | null
          tags: Json | null
          total_events: number | null
        }
        Insert: {
          address?: string | null
          anydesk_client_id: string
          comments?: string | null
          condominio_name: string
          consecutive_offline_count?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_online_at?: string | null
          metadata?: Json | null
          name: string
          offline_count?: number | null
          provider?: string | null
          status?: string | null
          tags?: Json | null
          total_events?: number | null
        }
        Update: {
          address?: string | null
          anydesk_client_id?: string
          comments?: string | null
          condominio_name?: string
          consecutive_offline_count?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_online_at?: string | null
          metadata?: Json | null
          name?: string
          offline_count?: number | null
          provider?: string | null
          status?: string | null
          tags?: Json | null
          total_events?: number | null
        }
        Relationships: []
      }
      directors: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          notify_preferences: Json | null
          phone: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notify_preferences?: Json | null
          phone: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notify_preferences?: Json | null
          phone?: string
        }
        Relationships: []
      }
      diretores_autorizados: {
        Row: {
          cargo: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          nivel_acesso: string | null
          nome: string
          updated_at: string | null
          whatsapp_number: string
        }
        Insert: {
          cargo?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          nivel_acesso?: string | null
          nome: string
          updated_at?: string | null
          whatsapp_number: string
        }
        Update: {
          cargo?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          nivel_acesso?: string | null
          nome?: string
          updated_at?: string | null
          whatsapp_number?: string
        }
        Relationships: []
      }
      email_audit_log: {
        Row: {
          created_at: string | null
          email_type: string
          error_message: string | null
          id: string
          metadata: Json | null
          pedido_id: string | null
          recipient_email: string
          recipient_id: string | null
          recipient_name: string | null
          resend_email_id: string | null
          retry_count: number | null
          status: string
          video_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          pedido_id?: string | null
          recipient_email: string
          recipient_id?: string | null
          recipient_name?: string | null
          resend_email_id?: string | null
          retry_count?: number | null
          status?: string
          video_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          pedido_id?: string | null
          recipient_email?: string
          recipient_id?: string | null
          recipient_name?: string | null
          resend_email_id?: string | null
          retry_count?: number | null
          status?: string
          video_id?: string | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          bounced_at: string | null
          clicked_at: string | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          failed_at: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          recipient_email: string
          recipient_name: string | null
          resend_id: string | null
          sent_at: string | null
          status: string
          subject: string
          template_id: string
          updated_at: string | null
        }
        Insert: {
          bounced_at?: string | null
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          recipient_email: string
          recipient_name?: string | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          template_id: string
          updated_at?: string | null
        }
        Update: {
          bounced_at?: string | null
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          recipient_email?: string
          recipient_name?: string | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      email_template_customizations: {
        Row: {
          created_at: string | null
          custom_colors: Json | null
          custom_html: string | null
          custom_subject: string | null
          id: string
          is_active: boolean | null
          template_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          custom_colors?: Json | null
          custom_html?: string | null
          custom_subject?: string | null
          id?: string
          is_active?: boolean | null
          template_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          custom_colors?: Json | null
          custom_html?: string | null
          custom_subject?: string | null
          id?: string
          is_active?: boolean | null
          template_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      email_template_history: {
        Row: {
          change_description: string | null
          created_at: string | null
          custom_html: string
          custom_subject: string | null
          id: string
          saved_by: string | null
          template_id: string
          version_number: number
        }
        Insert: {
          change_description?: string | null
          created_at?: string | null
          custom_html: string
          custom_subject?: string | null
          id?: string
          saved_by?: string | null
          template_id: string
          version_number: number
        }
        Update: {
          change_description?: string | null
          created_at?: string | null
          custom_html?: string
          custom_subject?: string | null
          id?: string
          saved_by?: string | null
          template_id?: string
          version_number?: number
        }
        Relationships: []
      }
      email_templates_cache: {
        Row: {
          created_at: string
          html_content: string
          id: string
          last_updated: string
          template_id: string
          template_name: string
          version: string
        }
        Insert: {
          created_at?: string
          html_content: string
          id?: string
          last_updated?: string
          template_id: string
          template_name: string
          version: string
        }
        Update: {
          created_at?: string
          html_content?: string
          id?: string
          last_updated?: string
          template_id?: string
          template_name?: string
          version?: string
        }
        Relationships: []
      }
      events_log: {
        Row: {
          computer_id: string
          created_at: string | null
          description: string | null
          event_type: string
          id: string
          metadata: Json | null
          new_status: string | null
          old_status: string | null
        }
        Insert: {
          computer_id: string
          created_at?: string | null
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
        }
        Update: {
          computer_id?: string
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_log_computer_id_fkey"
            columns: ["computer_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      exa_alerts_config: {
        Row: {
          config_key: string
          config_value: Json
          descricao: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          config_key: string
          config_value: Json
          descricao?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json
          descricao?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      exa_alerts_directors: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          departamento: string | null
          id: string
          nivel_acesso: string | null
          nome: string
          pode_usar_ia: boolean | null
          telefone: string
          telefone_verificado: boolean | null
          updated_at: string | null
          user_id: string | null
          verificado_em: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          departamento?: string | null
          id?: string
          nivel_acesso?: string | null
          nome: string
          pode_usar_ia?: boolean | null
          telefone: string
          telefone_verificado?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          verificado_em?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          departamento?: string | null
          id?: string
          nivel_acesso?: string | null
          nome?: string
          pode_usar_ia?: boolean | null
          telefone?: string
          telefone_verificado?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          verificado_em?: string | null
        }
        Relationships: []
      }
      exa_alerts_history: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          destinatario_nome: string | null
          destinatario_telefone: string
          id: string
          mensagem_enviada: string
          metadata: Json | null
          read_at: string | null
          response: string | null
          rule_id: string | null
          status: string | null
          tipo_alerta: string
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          destinatario_nome?: string | null
          destinatario_telefone: string
          id?: string
          mensagem_enviada: string
          metadata?: Json | null
          read_at?: string | null
          response?: string | null
          rule_id?: string | null
          status?: string | null
          tipo_alerta: string
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          destinatario_nome?: string | null
          destinatario_telefone?: string
          id?: string
          mensagem_enviada?: string
          metadata?: Json | null
          read_at?: string | null
          response?: string | null
          rule_id?: string | null
          status?: string | null
          tipo_alerta?: string
        }
        Relationships: [
          {
            foreignKeyName: "exa_alerts_history_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "exa_alerts_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      exa_alerts_rules: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          destinatarios: Json
          escalonamento: Json | null
          gatilho: Json
          horario_silencio_fim: string | null
          horario_silencio_inicio: string | null
          id: string
          nome: string
          template_mensagem: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          destinatarios: Json
          escalonamento?: Json | null
          gatilho: Json
          horario_silencio_fim?: string | null
          horario_silencio_inicio?: string | null
          id?: string
          nome: string
          template_mensagem: string
          tipo: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          destinatarios?: Json
          escalonamento?: Json | null
          gatilho?: Json
          horario_silencio_fim?: string | null
          horario_silencio_inicio?: string | null
          id?: string
          nome?: string
          template_mensagem?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      exa_alerts_verification_codes: {
        Row: {
          codigo: string
          created_at: string | null
          director_id: string | null
          expires_at: string
          id: string
          telefone: string
          verificado: boolean | null
        }
        Insert: {
          codigo: string
          created_at?: string | null
          director_id?: string | null
          expires_at: string
          id?: string
          telefone: string
          verificado?: boolean | null
        }
        Update: {
          codigo?: string
          created_at?: string | null
          director_id?: string | null
          expires_at?: string
          id?: string
          telefone?: string
          verificado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "exa_alerts_verification_codes_director_id_fkey"
            columns: ["director_id"]
            isOneToOne: false
            referencedRelation: "exa_alerts_directors"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_access_logs: {
        Row: {
          action: string
          created_at: string | null
          data_accessed: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          session_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          data_accessed?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          data_accessed?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_access_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_access_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_audit_logs: {
        Row: {
          access_timestamp: string | null
          details: Json | null
          id: string
          ip_address: unknown
          operation: string
          record_id: string | null
          risk_level: string | null
          sensitive_fields_accessed: string[] | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          access_timestamp?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          operation: string
          record_id?: string | null
          risk_level?: string | null
          sensitive_fields_accessed?: string[] | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          access_timestamp?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          operation?: string
          record_id?: string | null
          risk_level?: string | null
          sensitive_fields_accessed?: string[] | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      financial_data_audit_logs: {
        Row: {
          access_granted: boolean
          created_at: string
          id: string
          ip_address: string | null
          operation: string
          record_id: string | null
          risk_level: string
          sensitive_fields: string[]
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          access_granted?: boolean
          created_at?: string
          id?: string
          ip_address?: string | null
          operation: string
          record_id?: string | null
          risk_level?: string
          sensitive_fields?: string[]
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          access_granted?: boolean
          created_at?: string
          id?: string
          ip_address?: string | null
          operation?: string
          record_id?: string | null
          risk_level?: string
          sensitive_fields?: string[]
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      generated_reports: {
        Row: {
          agent_key: string | null
          contact_types: string[] | null
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          period_end: string | null
          period_start: string | null
          report_data: Json
          report_type: string | null
        }
        Insert: {
          agent_key?: string | null
          contact_types?: string[] | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          report_data: Json
          report_type?: string | null
        }
        Update: {
          agent_key?: string | null
          contact_types?: string[] | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          report_data?: Json
          report_type?: string | null
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
      ia_console_messages: {
        Row: {
          created_at: string | null
          director_id: string
          id: string
          message: string
          role: string
        }
        Insert: {
          created_at?: string | null
          director_id: string
          id?: string
          message: string
          role: string
        }
        Update: {
          created_at?: string | null
          director_id?: string
          id?: string
          message?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ia_console_messages_director_id_fkey"
            columns: ["director_id"]
            isOneToOne: false
            referencedRelation: "directors"
            referencedColumns: ["id"]
          },
        ]
      }
      iris_authorized_directors: {
        Row: {
          created_at: string | null
          department: string | null
          director_name: string
          id: string
          is_active: boolean | null
          phone_number: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          director_name: string
          id?: string
          is_active?: boolean | null
          phone_number: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          director_name?: string
          id?: string
          is_active?: boolean | null
          phone_number?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          agent_key: string | null
          created_at: string
          file_name: string
          id: string
          metadata: Json | null
          mime_type: string
          size: number
          status: string
          storage_path: string
          updated_at: string
        }
        Insert: {
          agent_key?: string | null
          created_at?: string
          file_name: string
          id?: string
          metadata?: Json | null
          mime_type: string
          size: number
          status?: string
          storage_path: string
          updated_at?: string
        }
        Update: {
          agent_key?: string | null
          created_at?: string
          file_name?: string
          id?: string
          metadata?: Json | null
          mime_type?: string
          size?: number
          status?: string
          storage_path?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_data_access_logs: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          operation: string
          record_count: number
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          operation: string
          record_count?: number
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          operation?: string
          record_count?: number
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lead_profiles: {
        Row: {
          administradora: string | null
          bairro_interesse: string | null
          conversation_id: string
          created_at: string | null
          empresa_nome: string | null
          estagio_compra: string | null
          hot_lead_score: number | null
          id: string
          intencao: string | null
          interesse_real: boolean | null
          is_hot_lead: boolean | null
          motivo_escalacao: string | null
          necessita_escalacao: boolean | null
          objecoes_identificadas: string[] | null
          orcamento_estimado: number | null
          predio_andares: number | null
          predio_nome: string | null
          predio_tipo: string | null
          predio_unidades: number | null
          predios_desejados: number | null
          probabilidade_fechamento: number | null
          proximos_passos: Json | null
          segmento: string | null
          updated_at: string | null
          urgencia: string | null
        }
        Insert: {
          administradora?: string | null
          bairro_interesse?: string | null
          conversation_id: string
          created_at?: string | null
          empresa_nome?: string | null
          estagio_compra?: string | null
          hot_lead_score?: number | null
          id?: string
          intencao?: string | null
          interesse_real?: boolean | null
          is_hot_lead?: boolean | null
          motivo_escalacao?: string | null
          necessita_escalacao?: boolean | null
          objecoes_identificadas?: string[] | null
          orcamento_estimado?: number | null
          predio_andares?: number | null
          predio_nome?: string | null
          predio_tipo?: string | null
          predio_unidades?: number | null
          predios_desejados?: number | null
          probabilidade_fechamento?: number | null
          proximos_passos?: Json | null
          segmento?: string | null
          updated_at?: string | null
          urgencia?: string | null
        }
        Update: {
          administradora?: string | null
          bairro_interesse?: string | null
          conversation_id?: string
          created_at?: string | null
          empresa_nome?: string | null
          estagio_compra?: string | null
          hot_lead_score?: number | null
          id?: string
          intencao?: string | null
          interesse_real?: boolean | null
          is_hot_lead?: boolean | null
          motivo_escalacao?: string | null
          necessita_escalacao?: boolean | null
          objecoes_identificadas?: string[] | null
          orcamento_estimado?: number | null
          predio_andares?: number | null
          predio_nome?: string | null
          predio_tipo?: string | null
          predio_unidades?: number | null
          predios_desejados?: number | null
          probabilidade_fechamento?: number | null
          proximos_passos?: Json | null
          segmento?: string | null
          updated_at?: string | null
          urgencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_profiles_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_qualifications: {
        Row: {
          budget_range: string | null
          classification: string | null
          contact_name: string | null
          contact_number: string
          conversation_id: string
          created_at: string | null
          id: string
          interest_areas: string[] | null
          notes: string | null
          profile_type: string | null
          qualified_by: string | null
          reason_for_risk: string | null
          risk_of_loss: boolean | null
          score: number | null
          spin_implication: number | null
          spin_need: number | null
          spin_problem: number | null
          spin_situation: number | null
          timeline: string | null
          updated_at: string | null
        }
        Insert: {
          budget_range?: string | null
          classification?: string | null
          contact_name?: string | null
          contact_number: string
          conversation_id: string
          created_at?: string | null
          id?: string
          interest_areas?: string[] | null
          notes?: string | null
          profile_type?: string | null
          qualified_by?: string | null
          reason_for_risk?: string | null
          risk_of_loss?: boolean | null
          score?: number | null
          spin_implication?: number | null
          spin_need?: number | null
          spin_problem?: number | null
          spin_situation?: number | null
          timeline?: string | null
          updated_at?: string | null
        }
        Update: {
          budget_range?: string | null
          classification?: string | null
          contact_name?: string | null
          contact_number?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          interest_areas?: string[] | null
          notes?: string | null
          profile_type?: string | null
          qualified_by?: string | null
          reason_for_risk?: string | null
          risk_of_loss?: boolean | null
          score?: number | null
          spin_implication?: number | null
          spin_need?: number | null
          spin_problem?: number | null
          spin_situation?: number | null
          timeline?: string | null
          updated_at?: string | null
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
      log_eventos_sistema: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          ip: string | null
          metadata: Json | null
          tipo_evento: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          ip?: string | null
          metadata?: Json | null
          tipo_evento: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          ip?: string | null
          metadata?: Json | null
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
          scale_factor: number | null
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
          scale_factor?: number | null
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
          scale_factor?: number | null
          sort_order?: number
          storage_bucket?: string | null
          storage_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          agent_key: string | null
          ai_analysis: Json | null
          body: string
          classification: Json | null
          conversation_id: string
          created_at: string | null
          detected_mood: number | null
          detected_urgency: number | null
          direction: string | null
          external_message_id: string | null
          from_role: string
          has_audio: boolean | null
          has_image: boolean | null
          id: string
          intent: string | null
          is_automated: boolean | null
          provider: string | null
          raw_payload: Json | null
          response_time: unknown
          sentiment: string | null
        }
        Insert: {
          agent_key?: string | null
          ai_analysis?: Json | null
          body: string
          classification?: Json | null
          conversation_id: string
          created_at?: string | null
          detected_mood?: number | null
          detected_urgency?: number | null
          direction?: string | null
          external_message_id?: string | null
          from_role: string
          has_audio?: boolean | null
          has_image?: boolean | null
          id?: string
          intent?: string | null
          is_automated?: boolean | null
          provider?: string | null
          raw_payload?: Json | null
          response_time?: unknown
          sentiment?: string | null
        }
        Update: {
          agent_key?: string | null
          ai_analysis?: Json | null
          body?: string
          classification?: Json | null
          conversation_id?: string
          created_at?: string | null
          detected_mood?: number | null
          detected_urgency?: number | null
          direction?: string | null
          external_message_id?: string | null
          from_role?: string
          has_audio?: boolean | null
          has_image?: boolean | null
          id?: string
          intent?: string | null
          is_automated?: boolean | null
          provider?: string | null
          raw_payload?: Json | null
          response_time?: unknown
          sentiment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          id: string
          panel_alerts_enabled: boolean | null
          panel_alerts_sound: boolean | null
          panel_alerts_volume: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          panel_alerts_enabled?: boolean | null
          panel_alerts_sound?: boolean | null
          panel_alerts_volume?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          panel_alerts_enabled?: boolean | null
          panel_alerts_sound?: boolean | null
          panel_alerts_volume?: number | null
          updated_at?: string | null
          user_id?: string | null
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
      paineis_comandos: {
        Row: {
          comando: string
          criado_em: string | null
          criado_por: string | null
          executado_em: string | null
          id: string
          painel_id: string | null
          parametros: Json | null
          resultado: Json | null
          status: string | null
        }
        Insert: {
          comando: string
          criado_em?: string | null
          criado_por?: string | null
          executado_em?: string | null
          id?: string
          painel_id?: string | null
          parametros?: Json | null
          resultado?: Json | null
          status?: string | null
        }
        Update: {
          comando?: string
          criado_em?: string | null
          criado_por?: string | null
          executado_em?: string | null
          id?: string
          painel_id?: string | null
          parametros?: Json | null
          resultado?: Json | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paineis_comandos_painel_id_fkey"
            columns: ["painel_id"]
            isOneToOne: false
            referencedRelation: "painels"
            referencedColumns: ["id"]
          },
        ]
      }
      paineis_status: {
        Row: {
          atualizado_em: string | null
          device_info: Json | null
          erro_ultimo: string | null
          ip_address: unknown
          painel_id: string
          status: string | null
          ultimo_heartbeat: string | null
          url_atual: string | null
          user_agent: string | null
        }
        Insert: {
          atualizado_em?: string | null
          device_info?: Json | null
          erro_ultimo?: string | null
          ip_address?: unknown
          painel_id: string
          status?: string | null
          ultimo_heartbeat?: string | null
          url_atual?: string | null
          user_agent?: string | null
        }
        Update: {
          atualizado_em?: string | null
          device_info?: Json | null
          erro_ultimo?: string | null
          ip_address?: unknown
          painel_id?: string
          status?: string | null
          ultimo_heartbeat?: string | null
          url_atual?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paineis_status_painel_id_fkey"
            columns: ["painel_id"]
            isOneToOne: true
            referencedRelation: "painels"
            referencedColumns: ["id"]
          },
        ]
      }
      paineis_vinculos: {
        Row: {
          building_id: string | null
          codigo: string
          criado_em: string | null
          criado_por: string | null
          expira_em: string | null
          id: string
          painel_id: string | null
          status: string | null
          vinculado_em: string | null
        }
        Insert: {
          building_id?: string | null
          codigo: string
          criado_em?: string | null
          criado_por?: string | null
          expira_em?: string | null
          id?: string
          painel_id?: string | null
          status?: string | null
          vinculado_em?: string | null
        }
        Update: {
          building_id?: string | null
          codigo?: string
          criado_em?: string | null
          criado_por?: string | null
          expira_em?: string | null
          id?: string
          painel_id?: string | null
          status?: string | null
          vinculado_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paineis_vinculos_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paineis_vinculos_painel_id_fkey"
            columns: ["painel_id"]
            isOneToOne: false
            referencedRelation: "painels"
            referencedColumns: ["id"]
          },
        ]
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
          codigo_vinculacao: string | null
          created_at: string | null
          data_vinculacao: string | null
          device_fingerprint: string | null
          device_info: Json | null
          id: string
          ip_interno: string | null
          link_instalacao: string | null
          localizacao: string | null
          mac_address: string | null
          marca: string | null
          modelo: string | null
          modo: string | null
          numero_painel: string | null
          observacoes: string | null
          orientacao: string | null
          polegada: string | null
          primeira_conexao_at: string | null
          resolucao: string | null
          senha_anydesk: string | null
          sistema_operacional: string | null
          status: string
          status_vinculo: string | null
          token_acesso: string | null
          ultima_sync: string | null
          versao_firmware: string | null
        }
        Insert: {
          building_id?: string | null
          code: string
          codigo_anydesk?: string | null
          codigo_vinculacao?: string | null
          created_at?: string | null
          data_vinculacao?: string | null
          device_fingerprint?: string | null
          device_info?: Json | null
          id?: string
          ip_interno?: string | null
          link_instalacao?: string | null
          localizacao?: string | null
          mac_address?: string | null
          marca?: string | null
          modelo?: string | null
          modo?: string | null
          numero_painel?: string | null
          observacoes?: string | null
          orientacao?: string | null
          polegada?: string | null
          primeira_conexao_at?: string | null
          resolucao?: string | null
          senha_anydesk?: string | null
          sistema_operacional?: string | null
          status?: string
          status_vinculo?: string | null
          token_acesso?: string | null
          ultima_sync?: string | null
          versao_firmware?: string | null
        }
        Update: {
          building_id?: string | null
          code?: string
          codigo_anydesk?: string | null
          codigo_vinculacao?: string | null
          created_at?: string | null
          data_vinculacao?: string | null
          device_fingerprint?: string | null
          device_info?: Json | null
          id?: string
          ip_interno?: string | null
          link_instalacao?: string | null
          localizacao?: string | null
          mac_address?: string | null
          marca?: string | null
          modelo?: string | null
          modo?: string | null
          numero_painel?: string | null
          observacoes?: string | null
          orientacao?: string | null
          polegada?: string | null
          primeira_conexao_at?: string | null
          resolucao?: string | null
          senha_anydesk?: string | null
          sistema_operacional?: string | null
          status?: string
          status_vinculo?: string | null
          token_acesso?: string | null
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
      panel_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          device_id: string
          id: string
          message: string
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          updated_at: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          device_id: string
          id?: string
          message: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          updated_at?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          device_id?: string
          id?: string
          message?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "panel_alerts_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      panel_monitoring_config: {
        Row: {
          alert_email: string | null
          alert_webhook_url: string | null
          check_interval_seconds: number | null
          created_at: string | null
          id: string
          offline_threshold_seconds: number | null
          updated_at: string | null
        }
        Insert: {
          alert_email?: string | null
          alert_webhook_url?: string | null
          check_interval_seconds?: number | null
          created_at?: string | null
          id?: string
          offline_threshold_seconds?: number | null
          updated_at?: string | null
        }
        Update: {
          alert_email?: string | null
          alert_webhook_url?: string | null
          check_interval_seconds?: number | null
          created_at?: string | null
          id?: string
          offline_threshold_seconds?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
      pedido_blocking_logs: {
        Row: {
          action_type: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          pedido_id: string
          performed_by: string
          reason: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          pedido_id: string
          performed_by: string
          reason?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          pedido_id?: string
          performed_by?: string
          reason?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedido_blocking_logs_pedido_id_fkey"
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
          blocked_at: string | null
          blocked_by: string | null
          blocked_reason: string | null
          checkout_session_id: string | null
          client_id: string
          compliance_data: Json | null
          created_at: string | null
          created_by_admin: string | null
          cupom_id: string | null
          data_fim: string | null
          data_inicio: string | null
          device_info: Json | null
          email: string | null
          expires_at: string | null
          id: string
          ip_origem: string | null
          is_test_order: boolean | null
          lista_paineis: string[] | null
          lista_predios: string[] | null
          log_pagamento: Json | null
          metodo_pagamento: string | null
          nome_pedido: string | null
          plano_meses: number
          price_sync_verified: boolean | null
          source_tentativa_id: string | null
          status: string
          termos_aceitos: boolean | null
          transaction_id: string | null
          updated_at: string | null
          valor_total: number | null
        }
        Insert: {
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          checkout_session_id?: string | null
          client_id: string
          compliance_data?: Json | null
          created_at?: string | null
          created_by_admin?: string | null
          cupom_id?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          device_info?: Json | null
          email?: string | null
          expires_at?: string | null
          id?: string
          ip_origem?: string | null
          is_test_order?: boolean | null
          lista_paineis?: string[] | null
          lista_predios?: string[] | null
          log_pagamento?: Json | null
          metodo_pagamento?: string | null
          nome_pedido?: string | null
          plano_meses?: number
          price_sync_verified?: boolean | null
          source_tentativa_id?: string | null
          status?: string
          termos_aceitos?: boolean | null
          transaction_id?: string | null
          updated_at?: string | null
          valor_total?: number | null
        }
        Update: {
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          checkout_session_id?: string | null
          client_id?: string
          compliance_data?: Json | null
          created_at?: string | null
          created_by_admin?: string | null
          cupom_id?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          device_info?: Json | null
          email?: string | null
          expires_at?: string | null
          id?: string
          ip_origem?: string | null
          is_test_order?: boolean | null
          lista_paineis?: string[] | null
          lista_predios?: string[] | null
          log_pagamento?: Json | null
          metodo_pagamento?: string | null
          nome_pedido?: string | null
          plano_meses?: number
          price_sync_verified?: boolean | null
          source_tentativa_id?: string | null
          status?: string
          termos_aceitos?: boolean | null
          transaction_id?: string | null
          updated_at?: string | null
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
            foreignKeyName: "pedidos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users_with_role"
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
      pedidos_cancelados_log: {
        Row: {
          cancelado_em: string
          client_id: string | null
          created_at: string
          dados_pedido: Json
          device_info: Json | null
          id: string
          ip_origem: string | null
          motivo: string
          pedido_id: string
          status_anterior: string | null
          valor_total: number | null
        }
        Insert: {
          cancelado_em?: string
          client_id?: string | null
          created_at: string
          dados_pedido: Json
          device_info?: Json | null
          id?: string
          ip_origem?: string | null
          motivo?: string
          pedido_id: string
          status_anterior?: string | null
          valor_total?: number | null
        }
        Update: {
          cancelado_em?: string
          client_id?: string | null
          created_at?: string
          dados_pedido?: Json
          device_info?: Json | null
          id?: string
          ip_origem?: string | null
          motivo?: string
          pedido_id?: string
          status_anterior?: string | null
          valor_total?: number | null
        }
        Relationships: []
      }
      pedidos_deletion_history: {
        Row: {
          deleted_at: string | null
          deleted_by: string | null
          id: string
          ip_address: string | null
          justification: string | null
          metadata: Json | null
          pedido_data: Json
          pedido_id: string
          user_agent: string | null
          videos_deleted: Json | null
        }
        Insert: {
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          ip_address?: string | null
          justification?: string | null
          metadata?: Json | null
          pedido_data: Json
          pedido_id: string
          user_agent?: string | null
          videos_deleted?: Json | null
        }
        Update: {
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          ip_address?: string | null
          justification?: string | null
          metadata?: Json | null
          pedido_data?: Json
          pedido_id?: string
          user_agent?: string | null
          videos_deleted?: Json | null
        }
        Relationships: []
      }
      permission_change_logs: {
        Row: {
          change_reason: string | null
          changed_by: string
          created_at: string
          id: string
          ip_address: string | null
          new_permissions: Json
          old_permissions: Json | null
          user_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_by: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_permissions: Json
          old_permissions?: Json | null
          user_id: string
        }
        Update: {
          change_reason?: string | null
          changed_by?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_permissions?: Json
          old_permissions?: Json | null
          user_id?: string
        }
        Relationships: []
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
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      provider_alerts: {
        Row: {
          computer_id: string
          detected_at: string | null
          id: string
          new_provider: string
          notified: boolean | null
          old_provider: string | null
        }
        Insert: {
          computer_id: string
          detected_at?: string | null
          id?: string
          new_provider: string
          notified?: boolean | null
          old_provider?: string | null
        }
        Update: {
          computer_id?: string
          detected_at?: string | null
          id?: string
          new_provider?: string
          notified?: boolean | null
          old_provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_alerts_computer_id_fkey"
            columns: ["computer_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_benefits: {
        Row: {
          access_token: string
          activation_point: string | null
          benefit_choice: string | null
          benefit_chosen_at: string | null
          created_at: string | null
          created_by: string | null
          delivery_type: string | null
          final_email_sent_at: string | null
          gift_code: string | null
          gift_code_inserted_at: string | null
          gift_code_inserted_by: string | null
          id: string
          invitation_sent_at: string | null
          observation: string | null
          provider_email: string
          provider_name: string
          redemption_instructions: string | null
          status: string | null
          token_used: boolean | null
          token_used_at: string | null
          updated_at: string | null
        }
        Insert: {
          access_token: string
          activation_point?: string | null
          benefit_choice?: string | null
          benefit_chosen_at?: string | null
          created_at?: string | null
          created_by?: string | null
          delivery_type?: string | null
          final_email_sent_at?: string | null
          gift_code?: string | null
          gift_code_inserted_at?: string | null
          gift_code_inserted_by?: string | null
          id?: string
          invitation_sent_at?: string | null
          observation?: string | null
          provider_email: string
          provider_name: string
          redemption_instructions?: string | null
          status?: string | null
          token_used?: boolean | null
          token_used_at?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          activation_point?: string | null
          benefit_choice?: string | null
          benefit_chosen_at?: string | null
          created_at?: string | null
          created_by?: string | null
          delivery_type?: string | null
          final_email_sent_at?: string | null
          gift_code?: string | null
          gift_code_inserted_at?: string | null
          gift_code_inserted_by?: string | null
          id?: string
          invitation_sent_at?: string | null
          observation?: string | null
          provider_email?: string
          provider_name?: string
          redemption_instructions?: string | null
          status?: string | null
          token_used?: boolean | null
          token_used_at?: string | null
          updated_at?: string | null
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
      quick_replies: {
        Row: {
          agent_key: string
          category: string | null
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          title: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          agent_key: string
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          agent_key?: string
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      report_access_tokens: {
        Row: {
          access_granted_at: string | null
          admin_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          report_id: string | null
          user_agent: string | null
        }
        Insert: {
          access_granted_at?: string | null
          admin_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          report_id?: string | null
          user_agent?: string | null
        }
        Update: {
          access_granted_at?: string | null
          admin_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          report_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_access_tokens_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "generated_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      role_change_audit: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          new_role: Database["public"]["Enums"]["app_role"] | null
          old_role: Database["public"]["Enums"]["app_role"] | null
          user_id: string | null
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_role?: Database["public"]["Enums"]["app_role"] | null
          old_role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string | null
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_role?: Database["public"]["Enums"]["app_role"] | null
          old_role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string | null
        }
        Relationships: []
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
      sync_runs: {
        Row: {
          created_at: string | null
          errors: Json | null
          finished_at: string | null
          id: string
          processed_count: number | null
          started_at: string
        }
        Insert: {
          created_at?: string | null
          errors?: Json | null
          finished_at?: string | null
          id?: string
          processed_count?: number | null
          started_at: string
        }
        Update: {
          created_at?: string | null
          errors?: Json | null
          finished_at?: string | null
          id?: string
          processed_count?: number | null
          started_at?: string
        }
        Relationships: []
      }
      system_activity_feed: {
        Row: {
          action: string
          activity_type: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          activity_type: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          activity_type?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
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
      terms_acceptance: {
        Row: {
          accepted_at: string
          id: string
          ip_address: string | null
          terms_version: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          id?: string
          ip_address?: string | null
          terms_version?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          id?: string
          ip_address?: string | null
          terms_version?: string
          user_agent?: string | null
          user_id?: string
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
      user_activity_logs: {
        Row: {
          action_description: string | null
          action_type: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_description?: string | null
          action_type: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_description?: string | null
          action_type?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      user_behavior_tracking: {
        Row: {
          created_at: string | null
          device_info: Json | null
          event_data: Json
          event_type: string
          id: string
          ip_address: unknown
          page_title: string | null
          page_url: string | null
          referrer: string | null
          session_id: string
          time_spent_seconds: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          event_data?: Json
          event_type: string
          id?: string
          ip_address?: unknown
          page_title?: string | null
          page_url?: string | null
          referrer?: string | null
          session_id: string
          time_spent_seconds?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          event_data?: Json
          event_type?: string
          id?: string
          ip_address?: unknown
          page_title?: string | null
          page_url?: string | null
          referrer?: string | null
          session_id?: string
          time_spent_seconds?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          asn: string | null
          browser: string | null
          city: string | null
          connection_type: string | null
          country: string | null
          country_code: string | null
          cpu_cores: number | null
          created_at: string | null
          device_memory: number | null
          device_type: string | null
          expires_at: string | null
          id: string
          ip_address: string | null
          is_vpn: boolean | null
          isp: string | null
          language: string | null
          languages: string | null
          last_activity: string | null
          latitude: number | null
          longitude: number | null
          org: string | null
          pixel_ratio: number | null
          platform: string | null
          referrer: string | null
          region: string | null
          screen_color_depth: number | null
          screen_height: number | null
          screen_width: number | null
          session_id: string
          timezone: string | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          asn?: string | null
          browser?: string | null
          city?: string | null
          connection_type?: string | null
          country?: string | null
          country_code?: string | null
          cpu_cores?: number | null
          created_at?: string | null
          device_memory?: number | null
          device_type?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_vpn?: boolean | null
          isp?: string | null
          language?: string | null
          languages?: string | null
          last_activity?: string | null
          latitude?: number | null
          longitude?: number | null
          org?: string | null
          pixel_ratio?: number | null
          platform?: string | null
          referrer?: string | null
          region?: string | null
          screen_color_depth?: number | null
          screen_height?: number | null
          screen_width?: number | null
          session_id: string
          timezone?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          asn?: string | null
          browser?: string | null
          city?: string | null
          connection_type?: string | null
          country?: string | null
          country_code?: string | null
          cpu_cores?: number | null
          created_at?: string | null
          device_memory?: number | null
          device_type?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_vpn?: boolean | null
          isp?: string | null
          language?: string | null
          languages?: string | null
          last_activity?: string | null
          latitude?: number | null
          longitude?: number | null
          org?: string | null
          pixel_ratio?: number | null
          platform?: string | null
          referrer?: string | null
          region?: string | null
          screen_color_depth?: number | null
          screen_height?: number | null
          screen_width?: number | null
          session_id?: string
          timezone?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          can_use_video_editor: boolean | null
          cpf: string | null
          data_criacao: string | null
          documento_estrangeiro: string | null
          documento_frente_url: string | null
          documento_verso_url: string | null
          email: string
          email_verified_at: string | null
          empresa_aceite_data: string | null
          empresa_aceite_termo: boolean | null
          empresa_aceite_termo_data: string | null
          empresa_documento: string | null
          empresa_nome: string | null
          empresa_pais: string | null
          empresa_segmento: string | null
          id: string
          nome: string | null
          privacy_accepted_at: string | null
          role: string
          telefone: string | null
          terms_accepted_at: string | null
          tipo_documento: string | null
          video_editor_enabled_at: string | null
          video_editor_enabled_by: string | null
        }
        Insert: {
          avatar_url?: string | null
          can_use_video_editor?: boolean | null
          cpf?: string | null
          data_criacao?: string | null
          documento_estrangeiro?: string | null
          documento_frente_url?: string | null
          documento_verso_url?: string | null
          email: string
          email_verified_at?: string | null
          empresa_aceite_data?: string | null
          empresa_aceite_termo?: boolean | null
          empresa_aceite_termo_data?: string | null
          empresa_documento?: string | null
          empresa_nome?: string | null
          empresa_pais?: string | null
          empresa_segmento?: string | null
          id: string
          nome?: string | null
          privacy_accepted_at?: string | null
          role: string
          telefone?: string | null
          terms_accepted_at?: string | null
          tipo_documento?: string | null
          video_editor_enabled_at?: string | null
          video_editor_enabled_by?: string | null
        }
        Update: {
          avatar_url?: string | null
          can_use_video_editor?: boolean | null
          cpf?: string | null
          data_criacao?: string | null
          documento_estrangeiro?: string | null
          documento_frente_url?: string | null
          documento_verso_url?: string | null
          email?: string
          email_verified_at?: string | null
          empresa_aceite_data?: string | null
          empresa_aceite_termo?: boolean | null
          empresa_aceite_termo_data?: string | null
          empresa_documento?: string | null
          empresa_nome?: string | null
          empresa_pais?: string | null
          empresa_segmento?: string | null
          id?: string
          nome?: string | null
          privacy_accepted_at?: string | null
          role?: string
          telefone?: string | null
          terms_accepted_at?: string | null
          tipo_documento?: string | null
          video_editor_enabled_at?: string | null
          video_editor_enabled_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_video_editor_enabled_by_fkey"
            columns: ["video_editor_enabled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_video_editor_enabled_by_fkey"
            columns: ["video_editor_enabled_by"]
            isOneToOne: false
            referencedRelation: "users_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      video_editor_access_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          project_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          project_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          project_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_editor_access_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "video_editor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_editor_access_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_editor_access_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      video_editor_assets: {
        Row: {
          asset_type: string
          created_at: string | null
          deleted_at: string | null
          file_name: string
          file_size_mb: number
          file_url: string
          folder: string | null
          id: string
          is_public: boolean | null
          is_template: boolean | null
          metadata: Json | null
          mime_type: string
          project_id: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asset_type: string
          created_at?: string | null
          deleted_at?: string | null
          file_name: string
          file_size_mb: number
          file_url: string
          folder?: string | null
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          metadata?: Json | null
          mime_type: string
          project_id?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          asset_type?: string
          created_at?: string | null
          deleted_at?: string | null
          file_name?: string
          file_size_mb?: number
          file_url?: string
          folder?: string | null
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          metadata?: Json | null
          mime_type?: string
          project_id?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_editor_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "video_editor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_editor_assets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_editor_assets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      video_editor_projects: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          description: string | null
          duration_seconds: number | null
          export_format: string | null
          export_quality: string | null
          export_resolution: string | null
          file_size_mb: number | null
          id: string
          last_edited_at: string | null
          output_url: string | null
          parent_version_id: string | null
          progress: number | null
          project_data: Json
          rendered_at: string | null
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string
          version: number | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          export_format?: string | null
          export_quality?: string | null
          export_resolution?: string | null
          file_size_mb?: number | null
          id?: string
          last_edited_at?: string | null
          output_url?: string | null
          parent_version_id?: string | null
          progress?: number | null
          project_data?: Json
          rendered_at?: string | null
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          version?: number | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          export_format?: string | null
          export_quality?: string | null
          export_resolution?: string | null
          file_size_mb?: number | null
          id?: string
          last_edited_at?: string | null
          output_url?: string | null
          parent_version_id?: string | null
          progress?: number | null
          project_data?: Json
          rendered_at?: string | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_editor_projects_parent_version_id_fkey"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "video_editor_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_editor_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_editor_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      video_editor_templates: {
        Row: {
          aspect_ratio: string | null
          category: string | null
          created_at: string | null
          default_duration: number | null
          description: string | null
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          name: string
          preview_url: string | null
          sort_order: number | null
          tags: string[] | null
          template_data: Json
          thumbnail_url: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          aspect_ratio?: string | null
          category?: string | null
          created_at?: string | null
          default_duration?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          name: string
          preview_url?: string | null
          sort_order?: number | null
          tags?: string[] | null
          template_data?: Json
          thumbnail_url?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          aspect_ratio?: string | null
          category?: string | null
          created_at?: string | null
          default_duration?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          name?: string
          preview_url?: string | null
          sort_order?: number | null
          tags?: string[] | null
          template_data?: Json
          thumbnail_url?: string | null
          updated_at?: string | null
          usage_count?: number | null
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
          {
            foreignKeyName: "videos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users_with_role"
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
      webhook_pix_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          pedido_id: string | null
          request_data: Json | null
          response_data: Json | null
          response_status: number | null
          success: boolean | null
          user_id: string | null
          webhook_url: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          pedido_id?: string | null
          request_data?: Json | null
          response_data?: Json | null
          response_status?: number | null
          success?: boolean | null
          user_id?: string | null
          webhook_url?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          pedido_id?: string | null
          request_data?: Json | null
          response_data?: Json | null
          response_status?: number | null
          success?: boolean | null
          user_id?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      zapi_connection_logs: {
        Row: {
          agent_key: string
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          instance_id: string | null
          phone: string | null
          triggered_by: string | null
        }
        Insert: {
          agent_key: string
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          instance_id?: string | null
          phone?: string | null
          triggered_by?: string | null
        }
        Update: {
          agent_key?: string
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          instance_id?: string | null
          phone?: string | null
          triggered_by?: string | null
        }
        Relationships: []
      }
      zapi_logs: {
        Row: {
          agent_key: string
          created_at: string | null
          direction: string
          error_message: string | null
          id: string
          is_read: boolean | null
          media_url: string | null
          message_text: string | null
          metadata: Json | null
          phone_number: string
          read_at: string | null
          status: string
          zapi_message_id: string | null
        }
        Insert: {
          agent_key: string
          created_at?: string | null
          direction: string
          error_message?: string | null
          id?: string
          is_read?: boolean | null
          media_url?: string | null
          message_text?: string | null
          metadata?: Json | null
          phone_number: string
          read_at?: string | null
          status?: string
          zapi_message_id?: string | null
        }
        Update: {
          agent_key?: string
          created_at?: string | null
          direction?: string
          error_message?: string | null
          id?: string
          is_read?: boolean | null
          media_url?: string | null
          message_text?: string | null
          metadata?: Json | null
          phone_number?: string
          read_at?: string | null
          status?: string
          zapi_message_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      dashboard_metrics: {
        Row: {
          critical_alerts: number | null
          events_today: number | null
          last_updated: string | null
          panels_offline: number | null
          panels_online: number | null
          panels_total: number | null
          unread_messages: number | null
        }
        Relationships: []
      }
      users_with_role: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          data_criacao: string | null
          documento_estrangeiro: string | null
          documento_frente_url: string | null
          documento_verso_url: string | null
          email: string | null
          email_verified_at: string | null
          id: string | null
          nome: string | null
          privacy_accepted_at: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          telefone: string | null
          terms_accepted_at: string | null
          tipo_documento: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_video: {
        Args: { p_pedido_id: string; p_pedido_video_id: string }
        Returns: boolean
      }
      admin_block_video: {
        Args: { p_block: boolean; p_pedido_video_id: string; p_reason?: string }
        Returns: Json
      }
      admin_check_user_exists: {
        Args: { user_email: string }
        Returns: boolean
      }
      admin_get_all_user_ids: { Args: never; Returns: string[] }
      admin_insert_user: {
        Args: { user_email: string; user_id: string; user_role: string }
        Returns: string
      }
      admin_mark_pedido_as_paid: {
        Args: {
          p_admin_notes: string
          p_payment_id: string
          p_pedido_id: string
        }
        Returns: Json
      }
      admin_unapprove_video: {
        Args: { p_pedido_video_id: string; p_reason: string }
        Returns: Json
      }
      admin_update_user_role_secure:
        | {
            Args: { p_admin_id?: string; p_new_role: string; p_user_id: string }
            Returns: Json
          }
        | {
            Args: { p_admin_id: string; p_new_role: string; p_user_id: string }
            Returns: Json
          }
      admin_update_user_secure: {
        Args: {
          p_cpf?: string
          p_documento_estrangeiro?: string
          p_email?: string
          p_role?: string
          p_tipo_documento?: string
          p_user_id: string
        }
        Returns: boolean
      }
      apply_coupon_secure: {
        Args: { p_codigo: string; p_pedido_id: string }
        Returns: Json
      }
      approve_video: {
        Args: { p_approved_by: string; p_pedido_video_id: string }
        Returns: boolean
      }
      audit_unauthorized_uploads: { Args: never; Returns: Json }
      auto_cancel_expired_orders: { Args: never; Returns: number }
      auto_cleanup_paid_attempts: { Args: never; Returns: Json }
      auto_fix_lost_transactions: { Args: never; Returns: Json }
      auto_recovery_system: { Args: never; Returns: Json }
      block_order_secure: {
        Args: {
          p_ip_address?: string
          p_pedido_id: string
          p_reason: string
          p_user_agent?: string
        }
        Returns: Json
      }
      bulk_delete_pedidos_secure: {
        Args: {
          p_ip_address?: string
          p_justificativa: string
          p_pedido_ids: string[]
          p_user_agent?: string
        }
        Returns: Json
      }
      calculate_device_stats: {
        Args: { device_id: string; period_end?: string; period_start?: string }
        Returns: Json
      }
      calculate_lifecycle_stage: {
        Args: { p_user_id: string }
        Returns: string
      }
      can_access_building_contacts: { Args: never; Returns: boolean }
      can_access_order: { Args: { p_pedido_id: string }; Returns: boolean }
      can_access_panel_credentials: { Args: never; Returns: boolean }
      can_access_pedido_secure: {
        Args: { p_pedido_id: string }
        Returns: boolean
      }
      cancel_expired_orders: { Args: never; Returns: Json }
      check_panel_availability: {
        Args: { p_end_date: string; p_panel_id: string; p_start_date: string }
        Returns: boolean
      }
      check_payment_already_processed: {
        Args: { p_payment_id: string }
        Returns: boolean
      }
      check_user_data_integrity: {
        Args: never
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
      cleanup_expired_blocked_ips: { Args: never; Returns: undefined }
      cleanup_expired_sessions: { Args: never; Returns: undefined }
      cleanup_old_logs: { Args: never; Returns: undefined }
      cleanup_orphaned_users: { Args: never; Returns: Json }
      cleanup_unauthorized_uploads: { Args: never; Returns: Json }
      daily_financial_reconciliation: { Args: never; Returns: Json }
      detect_duplicate_payments: {
        Args: never
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
      detect_financial_anomalies: { Args: never; Returns: Json }
      detect_suspicious_financial_access: {
        Args: never
        Returns: {
          access_count: number
          failed_attempts: number
          last_access: string
          risk_score: number
          user_id: string
        }[]
      }
      diagnose_user_system: { Args: never; Returns: Json }
      emergency_financial_audit_and_fix: { Args: never; Returns: Json }
      ensure_video_consistency: { Args: { p_pedido_id: string }; Returns: Json }
      extract_compliance_data: { Args: { payment_data: Json }; Returns: Json }
      generate_coupon_code: { Args: { prefix?: string }; Returns: string }
      generate_developer_token: { Args: never; Returns: string }
      generate_secure_temp_password: { Args: never; Returns: string }
      get_active_videos_for_panel: {
        Args: { p_panel_id: string }
        Returns: {
          video_duracao: number
          video_nome: string
          video_url: string
        }[]
      }
      get_admin_buildings_safe: {
        Args: never
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
        Args: never
        Returns: {
          pago_pendente_video: number
          video_aprovado: number
          video_enviado: number
          video_rejeitado: number
        }[]
      }
      get_approved_videos_by_period: {
        Args: { p_end_date?: string; p_start_date?: string }
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
      get_approved_videos_with_details: {
        Args: never
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
        Args: never
        Returns: {
          bairro: string
          codigo_predio: string
          id: string
          imagem_principal: string
          nome: string
          numero_elevadores: number
          preco_base: number
          publico_estimado: number
          quantidade_telas: number
          status: string
          venue_type: string
        }[]
      }
      get_buildings_for_public_store: {
        Args: never
        Returns: {
          amenities: string[]
          bairro: string
          caracteristicas: string[]
          endereco: string
          id: string
          imagem_principal: string
          latitude: number
          longitude: number
          nome: string
          numero_elevadores: number
          preco_base: number
          publico_estimado: number
          quantidade_telas: number
          status: string
          venue_type: string
          visualizacoes_mes: number
        }[]
      }
      get_coupon_stats: {
        Args: never
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
          lista_predios: string[]
          pedido_id: string
          plano_meses: number
          status_compra: string
          user_email: string
          user_telefone: string
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
      get_current_display_videos_batch: {
        Args: { p_pedido_ids: string[] }
        Returns: {
          is_scheduled: boolean
          pedido_id: string
          priority_type: string
          video_id: string
        }[]
      }
      get_dashboard_stats: { Args: never; Returns: Json }
      get_dashboard_stats_by_month: {
        Args: { p_month: number; p_year: number }
        Returns: Json
      }
      get_last_12_months_stats: { Args: never; Returns: Json }
      get_leads_exa_secure: {
        Args: never
        Returns: {
          contato_realizado: boolean
          created_at: string
          email: string
          empresa: string
          id: string
          nome: string
          objetivo: string
          updated_at: string
          whatsapp: string
        }[]
      }
      get_leads_linkae_secure: {
        Args: never
        Returns: {
          cargo: string
          contato_realizado: boolean
          created_at: string
          id: string
          nome_completo: string
          nome_empresa: string
          objetivo: string
          status: string
          updated_at: string
          whatsapp: string
        }[]
      }
      get_leads_produtora_secure: {
        Args: never
        Returns: {
          agendar_cafe: boolean
          contato_realizado: boolean
          created_at: string
          email: string
          empresa: string
          id: string
          nome: string
          objetivo: string
          tipo_video: string
          whatsapp: string
        }[]
      }
      get_monthly_comparison: {
        Args: { p_month: number; p_year: number }
        Returns: Json
      }
      get_own_sensitive_data: {
        Args: never
        Returns: {
          cpf: string
          documento_estrangeiro: string
          documento_frente_url: string
          documento_verso_url: string
        }[]
      }
      get_paid_orders_without_video: {
        Args: never
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
        Args: never
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
        Args: never
        Returns: {
          client_email: string
          client_id: string
          client_name: string
          created_at: string
          cupom_id: string
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
        Args: never
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
      get_provider_benefits_stats_by_month: {
        Args: { p_month: number; p_year: number }
        Returns: Json
      }
      get_real_approval_stats: {
        Args: never
        Returns: {
          approved: number
          paid_without_video: number
          pending_approval: number
          rejected: number
        }[]
      }
      get_real_revenue: { Args: never; Returns: number }
      get_recent_activities: {
        Args: { p_limit?: number }
        Returns: {
          action: string
          activity_type: string
          created_at: string
          details: Json
          entity_id: string
          entity_type: string
          id: string
          severity: string
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      get_recently_approved_videos: {
        Args: never
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
      get_secure_pedido_data: {
        Args: { p_pedido_id: string }
        Returns: {
          client_id: string
          compliance_data: Json
          created_at: string
          cupom_id: string
          data_fim: string
          data_inicio: string
          id: string
          lista_predios: string[]
          log_pagamento: Json
          mercadopago_transaction_id: string
          plano_meses: number
          status: string
          transaction_id: string
          valor_total: number
        }[]
      }
      get_sindicos_interessados_secure: {
        Args: never
        Returns: {
          celular: string
          created_at: string
          data_contato: string
          email: string
          endereco: string
          id: string
          nome_completo: string
          nome_predio: string
          numero_andares: number
          numero_unidades: number
          observacoes: string
          responsavel_contato: string
          status: string
          updated_at: string
        }[]
      }
      get_unified_client_data: { Args: { p_user_id: string }; Returns: Json }
      get_unread_notifications_count: { Args: never; Returns: number }
      get_user_activity_summary: { Args: { p_user_id: string }; Returns: Json }
      get_user_behavior_summary: {
        Args: { target_user_id: string }
        Returns: {
          buildings_clicked: Json
          cart_interactions: Json
          first_visit: string
          last_activity: string
          map_interactions: Json
          page_views: Json
          searches: Json
          time_by_page: Json
          total_events: number
          total_sessions: number
        }[]
      }
      get_user_role:
        | { Args: never; Returns: string }
        | {
            Args: { _user_id: string }
            Returns: Database["public"]["Enums"]["app_role"]
          }
      get_user_stats: { Args: never; Returns: Json }
      get_user_with_last_access: {
        Args: { target_user_id?: string }
        Returns: {
          avatar_url: string
          cpf: string
          data_criacao: string
          documento_estrangeiro: string
          documento_frente_url: string
          documento_verso_url: string
          email: string
          email_confirmed_at: string
          email_verified_at: string
          id: string
          last_access_at: string
          last_sign_in_at: string
          nome: string
          privacy_accepted_at: string
          raw_user_meta_data: Json
          role: string
          telefone: string
          terms_accepted_at: string
          tipo_documento: string
        }[]
      }
      get_users_with_last_access: {
        Args: never
        Returns: {
          avatar_url: string
          cpf: string
          data_criacao: string
          documento_estrangeiro: string
          documento_frente_url: string
          documento_verso_url: string
          email: string
          email_confirmed_at: string
          email_verified_at: string
          id: string
          last_access_at: string
          last_sign_in_at: string
          nome: string
          privacy_accepted_at: string
          raw_user_meta_data: Json
          role: string
          telefone: string
          terms_accepted_at: string
          tipo_documento: string
        }[]
      }
      get_video_current_status: { Args: { p_video_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_conversation_analytics: {
        Args: {
          p_agent_key: string
          p_conversation_id: string
          p_phone: string
        }
        Returns: undefined
      }
      insert_system_log: {
        Args: {
          p_descricao: string
          p_ip?: string
          p_metadata?: Json
          p_tipo_evento: string
          p_user_agent?: string
        }
        Returns: string
      }
      investigate_missing_transaction: {
        Args: { p_amount: number; p_email: string }
        Returns: Json
      }
      is_admin_user: { Args: never; Returns: boolean }
      is_current_user_super_admin: { Args: never; Returns: boolean }
      is_emergency_mode: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      is_super_admin_secure: { Args: never; Returns: boolean }
      is_super_admin_simple: { Args: never; Returns: boolean }
      is_super_admin_user: { Args: never; Returns: boolean }
      is_user_admin: { Args: { user_id: string }; Returns: boolean }
      limpar_codigos_expirados: { Args: never; Returns: undefined }
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
      log_client_activity: {
        Args: { p_event_data?: Json; p_event_type: string; p_user_id: string }
        Returns: undefined
      }
      log_financial_access: {
        Args: {
          p_operation: string
          p_record_id: string
          p_risk_level?: string
          p_sensitive_fields: string[]
          p_table_name: string
        }
        Returns: boolean
      }
      log_payment_processing_secure: {
        Args: {
          p_amount?: number
          p_details?: Json
          p_external_reference?: string
          p_payment_id: string
          p_pedido_id?: string
          p_webhook_source?: string
        }
        Returns: string
      }
      log_payment_status_change_secure: {
        Args: {
          p_detalhes?: Json
          p_origem?: string
          p_pedido_id: string
          p_status_anterior: string
          p_status_novo: string
        }
        Returns: string
      }
      log_system_activity: {
        Args: {
          p_action?: string
          p_activity_type?: string
          p_details?: Json
          p_entity_id?: string
          p_entity_type?: string
          p_ip_address?: string
          p_severity?: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: string
      }
      marcar_paineis_offline: { Args: never; Returns: undefined }
      mark_exa_lead_contacted_secure: {
        Args: { p_lead_id: string }
        Returns: Json
      }
      mark_linkae_lead_contacted_secure: {
        Args: { p_lead_id: string }
        Returns: Json
      }
      mark_notification_read: {
        Args: { notification_id: string }
        Returns: boolean
      }
      mark_produtora_lead_contacted_secure: {
        Args: { p_lead_id: string }
        Returns: Json
      }
      mercadopago_reconciliation_check: { Args: never; Returns: Json }
      migrate_orphaned_payments: { Args: never; Returns: Json }
      monitor_coupon_security: { Args: never; Returns: Json }
      monitor_system_health: { Args: never; Returns: Json }
      notify_contracts_expiring_soon: { Args: never; Returns: Json }
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
      recover_lost_transactions: { Args: never; Returns: Json }
      refresh_dashboard_metrics: { Args: never; Returns: undefined }
      register_benefit_choice: {
        Args: { p_choice: string; p_token: string }
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
      resolve_email_conflicts: { Args: never; Returns: Json }
      revert_suspicious_payment: {
        Args: { p_pedido_id: string; p_reason?: string }
        Returns: Json
      }
      safe_create_admin_user: {
        Args: { p_email: string; p_password?: string; p_role: string }
        Returns: Json
      }
      safe_log_financial_access: {
        Args: {
          p_operation: string
          p_record_id: string
          p_risk_level?: string
          p_sensitive_fields: string[]
          p_table_name: string
        }
        Returns: boolean
      }
      safe_set_base_video: { Args: { p_slot_id: string }; Returns: Json }
      select_video_for_display: {
        Args: { p_pedido_video_id: string }
        Returns: boolean
      }
      set_base_video: { Args: { p_pedido_video_id: string }; Returns: boolean }
      set_pedido_nome: {
        Args: { p_nome: string; p_pedido_id: string }
        Returns: {
          nome_pedido: string
          pedido_id: string
        }[]
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
      super_admin_bulk_delete_pedidos: {
        Args: {
          p_ip_address?: string
          p_justification: string
          p_pedido_ids: string[]
          p_user_agent?: string
        }
        Returns: Json
      }
      super_admin_delete_pedido_complete: {
        Args: {
          p_ip_address?: string
          p_justification: string
          p_pedido_id: string
          p_user_agent?: string
        }
        Returns: Json
      }
      switch_video_selection: {
        Args: { p_pedido_video_id: string }
        Returns: boolean
      }
      sync_auth_user_to_public: {
        Args: { auth_user_id: string }
        Returns: Json
      }
      unblock_order_secure: {
        Args: { p_pedido_id: string; p_reason?: string }
        Returns: Json
      }
      update_expired_contracts: { Args: never; Returns: Json }
      update_expired_contracts_daily: { Args: never; Returns: Json }
      update_panel_secure: {
        Args: { p_panel_id: string; p_updates: Json }
        Returns: Json
      }
      update_sindico_status_secure: {
        Args: { p_new_status: string; p_sindico_id: string }
        Returns: Json
      }
      update_user_profile_secure: {
        Args: {
          p_avatar_url?: string
          p_email_verified_at?: string
          p_privacy_accepted_at?: string
          p_terms_accepted_at?: string
        }
        Returns: boolean
      }
      validate_benefit_token: { Args: { p_token: string }; Returns: Json }
      validate_coupon_secure:
        | { Args: { p_codigo: string; p_valor_pedido?: number }; Returns: Json }
        | {
            Args: {
              p_codigo: string
              p_quantidade_predios?: number
              p_valor_pedido?: number
            }
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
      validate_developer_token: { Args: { p_token: string }; Returns: boolean }
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
      app_role:
        | "client"
        | "admin"
        | "admin_marketing"
        | "super_admin"
        | "painel"
        | "admin_financeiro"
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
    Enums: {
      app_role: [
        "client",
        "admin",
        "admin_marketing",
        "super_admin",
        "painel",
        "admin_financeiro",
      ],
    },
  },
} as const
