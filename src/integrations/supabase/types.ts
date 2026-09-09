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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          page: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          page?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          page?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_audit_log: {
        Row: {
          created_at: string
          details: Json
          email: string | null
          error_message: string | null
          event_type: string
          id: string
          method: string | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json
          email?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          method?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json
          email?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          method?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      content_items: {
        Row: {
          access_level: string
          author: string | null
          content_type: string
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          file_url: string | null
          grade: number | null
          id: string
          is_published: boolean
          language: string | null
          metadata: Json | null
          subject: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          access_level?: string
          author?: string | null
          content_type: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          grade?: number | null
          id?: string
          is_published?: boolean
          language?: string | null
          metadata?: Json | null
          subject?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          access_level?: string
          author?: string | null
          content_type?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          grade?: number | null
          id?: string
          is_published?: boolean
          language?: string | null
          metadata?: Json | null
          subject?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      login_history: {
        Row: {
          created_at: string
          id: string
          login_method: string
          success: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          login_method: string
          success?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          login_method?: string
          success?: boolean
          user_id?: string
        }
        Relationships: []
      }
      margeos_agent_logs: {
        Row: {
          agent: string
          content: string
          created_at: string
          id: string
          metadata: Json
          role: string
          task_id: string | null
          tokens: number | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          agent: string
          content: string
          created_at?: string
          id?: string
          metadata?: Json
          role?: string
          task_id?: string | null
          tokens?: number | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          agent?: string
          content?: string
          created_at?: string
          id?: string
          metadata?: Json
          role?: string
          task_id?: string | null
          tokens?: number | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "margeos_agent_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "margeos_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "margeos_agent_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "margeos_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      margeos_analytics_events: {
        Row: {
          category: string
          created_at: string
          event: string
          id: string
          metadata: Json
          subject: string | null
          user_id: string
          value: number
          workspace_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          event: string
          id?: string
          metadata?: Json
          subject?: string | null
          user_id: string
          value?: number
          workspace_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          event?: string
          id?: string
          metadata?: Json
          subject?: string | null
          user_id?: string
          value?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "margeos_analytics_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "margeos_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      margeos_executions: {
        Row: {
          command: string | null
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          kind: string
          output: string | null
          status: string
          task_id: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          command?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          kind: string
          output?: string | null
          status?: string
          task_id?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          command?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          kind?: string
          output?: string | null
          status?: string
          task_id?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "margeos_executions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "margeos_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "margeos_executions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "margeos_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      margeos_knowledge_entries: {
        Row: {
          category: string
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json
          source: string | null
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json
          source?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json
          source?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      margeos_memory_entries: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          key: string | null
          metadata: Json
          scope: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          key?: string | null
          metadata?: Json
          scope?: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          key?: string | null
          metadata?: Json
          scope?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "margeos_memory_entries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "margeos_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      margeos_sessions: {
        Row: {
          created_at: string
          id: string
          label: string | null
          last_active_at: string
          state: Json
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          last_active_at?: string
          state?: Json
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          last_active_at?: string
          state?: Json
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "margeos_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "margeos_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      margeos_tasks: {
        Row: {
          assigned_agent: string | null
          created_at: string
          description: string | null
          error: string | null
          id: string
          plan: Json | null
          priority: number
          result: Json | null
          status: string
          title: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          assigned_agent?: string | null
          created_at?: string
          description?: string | null
          error?: string | null
          id?: string
          plan?: Json | null
          priority?: number
          result?: Json | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          assigned_agent?: string | null
          created_at?: string
          description?: string | null
          error?: string | null
          id?: string
          plan?: Json | null
          priority?: number
          result?: Json | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "margeos_tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "margeos_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      margeos_workspace_files: {
        Row: {
          content: string | null
          created_at: string
          id: string
          kind: string
          metadata: Json
          mime: string | null
          name: string
          parent_id: string | null
          path: string
          size_bytes: number
          storage_path: string | null
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          kind: string
          metadata?: Json
          mime?: string | null
          name: string
          parent_id?: string | null
          path: string
          size_bytes?: number
          storage_path?: string | null
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          kind?: string
          metadata?: Json
          mime?: string | null
          name?: string
          parent_id?: string | null
          path?: string
          size_bytes?: number
          storage_path?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "margeos_workspace_files_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "margeos_workspace_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "margeos_workspace_files_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "margeos_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      margeos_workspaces: {
        Row: {
          archived: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          settings: Json
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          settings?: Json
          slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          settings?: Json
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nav_items: {
        Row: {
          auth_required: boolean
          created_at: string
          icon: string | null
          id: string
          label: string
          path: string
          roles: string[] | null
          sort_order: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          auth_required?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          label: string
          path: string
          roles?: string[] | null
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          auth_required?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          label?: string
          path?: string
          roles?: string[] | null
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          grade: number | null
          id: string
          language: string | null
          last_login_at: string | null
          name: string
          phone: string | null
          phone_country_code: string | null
          role: string | null
          signup_source: string | null
          study_plan: string | null
          subscription: string
          subscription_expires_at: string | null
          last_active_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          grade?: number | null
          id?: string
          language?: string | null
          last_login_at?: string | null
          name?: string
          phone?: string | null
          phone_country_code?: string | null
          role?: string | null
          signup_source?: string | null
          study_plan?: string | null
          subscription?: string
          subscription_expires_at?: string | null
          last_active_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          grade?: number | null
          id?: string
          language?: string | null
          last_login_at?: string | null
          name?: string
          phone?: string | null
          phone_country_code?: string | null
          role?: string | null
          signup_source?: string | null
          study_plan?: string | null
          subscription?: string
          subscription_expires_at?: string | null
          last_active_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_progress: {
        Row: {
          content_item_id: string
          created_at: string
          current_page: number
          id: string
          last_read_at: string
          progress_percent: number
          total_pages: number
          user_id: string
        }
        Insert: {
          content_item_id: string
          created_at?: string
          current_page?: number
          id?: string
          last_read_at?: string
          progress_percent?: number
          total_pages?: number
          user_id: string
        }
        Update: {
          content_item_id?: string
          created_at?: string
          current_page?: number
          id?: string
          last_read_at?: string
          progress_percent?: number
          total_pages?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          payment_method: string
          payment_status: string
          plan_name: string
          reference_number: string | null
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
          verification_status: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          payment_method?: string
          payment_status?: string
          plan_name?: string
          reference_number?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          payment_method?: string
          payment_status?: string
          plan_name?: string
          reference_number?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string
        }
        Relationships: []
      }
      quizzes: {
        Row: {
          answers: Json | null
          created_at: string
          difficulty: string | null
          grade: number | null
          id: string
          metadata: Json | null
          passed: boolean | null
          percentage: number | null
          score: number
          subject: string
          title: string
          total_questions: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string
          difficulty?: string | null
          grade?: number | null
          id?: string
          metadata?: Json | null
          passed?: boolean | null
          percentage?: number | null
          score?: number
          subject?: string
          title?: string
          total_questions?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string
          difficulty?: string | null
          grade?: number | null
          id?: string
          metadata?: Json | null
          passed?: boolean | null
          percentage?: number | null
          score?: number
          subject?: string
          title?: string
          total_questions?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          created_at: string
          date: string
          id: string
          is_online: boolean
          last_seen: string
          presence_updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          is_online?: boolean
          last_seen?: string
          presence_updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_online?: boolean
          last_seen?: string
          presence_updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          created_at: string
          grade: number | null
          id: string
          passed: boolean | null
          percentage: number | null
          quiz_id: string | null
          score: number
          subject: string | null
          time_spent_seconds: number | null
          total_questions: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          created_at?: string
          grade?: number | null
          id?: string
          passed?: boolean | null
          percentage?: number | null
          quiz_id?: string | null
          score?: number
          subject?: string | null
          time_spent_seconds?: number | null
          total_questions?: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          created_at?: string
          grade?: number | null
          id?: string
          passed?: boolean | null
          percentage?: number | null
          quiz_id?: string | null
          score?: number
          subject?: string | null
          time_spent_seconds?: number | null
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string
          difficulty: string | null
          explanation: string | null
          grade: number | null
          id: string
          options: Json
          order_index: number | null
          question: string
          quiz_id: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          grade?: number | null
          id?: string
          options?: Json
          order_index?: number | null
          question: string
          quiz_id?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          grade?: number | null
          id?: string
          options?: Json
          order_index?: number | null
          question?: string
          quiz_id?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_activity_date: string
          longest_streak: number
          streak_freeze_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string
          longest_streak?: number
          streak_freeze_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string
          longest_streak?: number
          streak_freeze_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          device_info: Json | null
          duration_minutes: number
          ended_at: string | null
          id: string
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_chats: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          message_count: number
          session_id: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          message_count?: number
          session_id?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          message_count?: number
          session_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          completion_tokens: number
          created_at: string
          feature: string | null
          id: string
          model: string | null
          prompt_tokens: number
          provider: string | null
          tokens_used: number
          user_id: string
        }
        Insert: {
          completion_tokens?: number
          created_at?: string
          feature?: string | null
          id?: string
          model?: string | null
          prompt_tokens?: number
          provider?: string | null
          tokens_used?: number
          user_id: string
        }
        Update: {
          completion_tokens?: number
          created_at?: string
          feature?: string | null
          id?: string
          model?: string | null
          prompt_tokens?: number
          provider?: string | null
          tokens_used?: number
          user_id?: string
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          difficulty: string | null
          enabled: boolean
          free_img_limit: number
          free_msg_limit: number
          free_msg_limit_per_provider: number
          id: number
          model_preference: string | null
          personality: string | null
          response_length: string | null
          updated_at: string
          voice_enabled: boolean | null
          window_hours: number
        }
        Insert: {
          difficulty?: string | null
          enabled?: boolean
          free_img_limit?: number
          free_msg_limit?: number
          free_msg_limit_per_provider?: number
          id?: number
          model_preference?: string | null
          personality?: string | null
          response_length?: string | null
          updated_at?: string
          voice_enabled?: boolean | null
          window_hours?: number
        }
        Update: {
          difficulty?: string | null
          enabled?: boolean
          free_img_limit?: number
          free_msg_limit?: number
          free_msg_limit_per_provider?: number
          id?: number
          model_preference?: string | null
          personality?: string | null
          response_length?: string | null
          updated_at?: string
          voice_enabled?: boolean | null
          window_hours?: number
        }
        Relationships: []
      }
      classrooms: {
        Row: {
          created_at: string
          description: string | null
          grade: number | null
          id: string
          join_code: string
          name: string
          schedule: string | null
          settings: Json | null
          student_count: number
          subject: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          grade?: number | null
          id?: string
          join_code: string
          name: string
          schedule?: string | null
          settings?: Json | null
          student_count?: number
          subject?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          grade?: number | null
          id?: string
          join_code?: string
          name?: string
          schedule?: string | null
          settings?: Json | null
          student_count?: number
          subject?: string | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      classroom_students: {
        Row: {
          classroom_id: string
          grade_level: number | null
          id: string
          joined_at: string
          last_active_at: string | null
          status: string
          student_id: string
        }
        Insert: {
          classroom_id: string
          grade_level?: number | null
          id?: string
          joined_at?: string
          last_active_at?: string | null
          status?: string
          student_id: string
        }
        Update: {
          classroom_id?: string
          grade_level?: number | null
          id?: string
          joined_at?: string
          last_active_at?: string | null
          status?: string
          student_id?: string
        }
        Relationships: []
      }
      classroom_assignments: {
        Row: {
          classroom_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          max_points: number | null
          status: string
          title: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          max_points?: number | null
          status?: string
          title: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          max_points?: number | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      study_rooms: {
        Row: {
          active: boolean
          created_at: string
          creator_id: string
          current_members: number
          id: string
          is_private: boolean
          max_members: number
          name: string
          passkey: string | null
          subject: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          creator_id: string
          current_members?: number
          id?: string
          is_private?: boolean
          max_members?: number
          name: string
          passkey?: string | null
          subject?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          creator_id?: string
          current_members?: number
          id?: string
          is_private?: boolean
          max_members?: number
          name?: string
          passkey?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      study_room_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          room_id: string
          sender_id: string
          sender_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          room_id: string
          sender_id: string
          sender_name?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          room_id?: string
          sender_id?: string
          sender_name?: string
        }
        Relationships: []
      }
      study_room_participants: {
        Row: {
          id: string
          is_muted: boolean
          joined_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_muted?: boolean
          joined_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_muted?: boolean
          joined_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_id: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_id?: string | null
          event_type: string
          id?: string
          payload?: Json
          processed_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_id?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          status?: string
        }
        Relationships: []
      }
      concept_mastery: {
        Row: {
          concept_id: string
          concept_name: string
          created_at: string
          id: string
          last_practiced_at: string | null
          mastery_level: number
          practice_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          concept_id: string
          concept_name: string
          created_at?: string
          id?: string
          last_practiced_at?: string | null
          mastery_level?: number
          practice_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          concept_id?: string
          concept_name?: string
          created_at?: string
          id?: string
          last_practiced_at?: string | null
          mastery_level?: number
          practice_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_worlds: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          grade_range: unknown | null
          icon: string | null
          id: string
          is_active: boolean
          order_index: number
          slug: string
          title: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          grade_range?: unknown | null
          icon?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          slug: string
          title: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          grade_range?: unknown | null
          icon?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          slug?: string
          title?: string
        }
        Relationships: []
      }
      user_world_progress: {
        Row: {
          completed_nodes: string[] | null
          created_at: string
          id: string
          last_played_at: string | null
          progress_percentage: number
          total_xp: number
          updated_at: string
          user_id: string
          world_id: string
        }
        Insert: {
          completed_nodes?: string[] | null
          created_at?: string
          id?: string
          last_played_at?: string | null
          progress_percentage?: number
          total_xp?: number
          updated_at?: string
          user_id: string
          world_id: string
        }
        Update: {
          completed_nodes?: string[] | null
          created_at?: string
          id?: string
          last_played_at?: string | null
          progress_percentage?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
          world_id?: string
        }
        Relationships: []
      }
      learning_pathways: {
        Row: {
          created_at: string
          description: string | null
          grade: number | null
          id: string
          node_order: number | null
          subject: string | null
          title: string
          world_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          grade?: number | null
          id?: string
          node_order?: number | null
          subject?: string | null
          title: string
          world_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          grade?: number | null
          id?: string
          node_order?: number | null
          subject?: string | null
          title?: string
          world_id?: string | null
        }
        Relationships: []
      }
      guilds: {
        Row: {
          created_at: string
          description: string | null
          id: string
          leader_id: string
          level: number
          max_members: number
          member_count: number
          name: string
          tag: string
          total_xp: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          leader_id: string
          level?: number
          max_members?: number
          member_count?: number
          name: string
          tag: string
          total_xp?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          leader_id?: string
          level?: number
          max_members?: number
          member_count?: number
          name?: string
          tag?: string
          total_xp?: number
          updated_at?: string
        }
        Relationships: []
      }
      guild_members: {
        Row: {
          contribution_xp: number
          guild_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          contribution_xp?: number
          guild_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          contribution_xp?: number
          guild_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      guild_messages: {
        Row: {
          created_at: string
          guild_id: string
          id: string
          message: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          guild_id: string
          id?: string
          message: string
          sender_id: string
        }
        Update: {
          created_at?: string
          guild_id?: string
          id?: string
          message?: string
          sender_id?: string
        }
        Relationships: []
      }
      motivation_timeline: {
        Row: {
          burnout_risk_score: number
          consistency_score: number
          created_at: string
          daily_sessions: number
          date: string
          description: string | null
          event_type: string | null
          id: string
          recorded_at: string | null
          study_intensity: number
          total_session_minutes: number
          user_id: string
          value: number | null
        }
        Insert: {
          burnout_risk_score?: number
          consistency_score?: number
          created_at?: string
          daily_sessions?: number
          date?: string
          description?: string | null
          event_type?: string | null
          id?: string
          recorded_at?: string | null
          study_intensity?: number
          total_session_minutes?: number
          user_id: string
          value?: number | null
        }
        Update: {
          burnout_risk_score?: number
          consistency_score?: number
          created_at?: string
          daily_sessions?: number
          date?: string
          description?: string | null
          event_type?: string | null
          id?: string
          recorded_at?: string | null
          study_intensity?: number
          total_session_minutes?: number
          user_id?: string
          value?: number | null
        }
        Relationships: []
      }
      burnout_recovery_phases: {
        Row: {
          active: boolean | null
          created_at: string
          fatigue_score: number | null
          id: string
          initial_burnout_score: number
          onset_date: string
          phase: string | null
          recommended_action: string | null
          recovery_complete_date: string | null
          recovery_duration_days: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          fatigue_score?: number | null
          id?: string
          initial_burnout_score?: number
          onset_date?: string
          phase?: string | null
          recommended_action?: string | null
          recovery_complete_date?: string | null
          recovery_duration_days?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          fatigue_score?: number | null
          id?: string
          initial_burnout_score?: number
          onset_date?: string
          phase?: string | null
          recommended_action?: string | null
          recovery_complete_date?: string | null
          recovery_duration_days?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_arc_snapshots: {
        Row: {
          confidence_level: number
          created_at: string
          date: string
          id: string
          quiz_accuracy: number
          quiz_count: number
          streak_days: number
          study_duration_minutes: number
          subject: string
          user_id: string
        }
        Insert: {
          confidence_level?: number
          created_at?: string
          date?: string
          id?: string
          quiz_accuracy?: number
          quiz_count?: number
          streak_days?: number
          study_duration_minutes?: number
          subject: string
          user_id: string
        }
        Update: {
          confidence_level?: number
          created_at?: string
          date?: string
          id?: string
          quiz_accuracy?: number
          quiz_count?: number
          streak_days?: number
          study_duration_minutes?: number
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      memory_vault_aggregates: {
        Row: {
          analysis_date: string
          avg_quiz_score: number | null
          avg_study_streak: number
          burnout_prevalence_pct: number
          created_at: string
          id: string
          last_calculated_at: string | null
          streak_days: number | null
          total_quizzes_taken: number | null
          total_study_minutes: number | null
          total_users_analyzed: number
          user_id: string | null
        }
        Insert: {
          analysis_date?: string
          avg_quiz_score?: number | null
          avg_study_streak?: number
          burnout_prevalence_pct?: number
          created_at?: string
          id?: string
          last_calculated_at?: string | null
          streak_days?: number | null
          total_quizzes_taken?: number | null
          total_study_minutes?: number | null
          total_users_analyzed?: number
          user_id?: string | null
        }
        Update: {
          analysis_date?: string
          avg_quiz_score?: number | null
          avg_study_streak?: number
          burnout_prevalence_pct?: number
          created_at?: string
          id?: string
          last_calculated_at?: string | null
          streak_days?: number | null
          total_quizzes_taken?: number | null
          total_study_minutes?: number | null
          total_users_analyzed?: number
          user_id?: string | null
        }
        Relationships: []
      }
      creator_projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          language: string
          name: string
          template: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          language?: string
          name: string
          template?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          language?: string
          name?: string
          template?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      creator_files: {
        Row: {
          content: string | null
          id: string
          language: string | null
          path: string
          project_id: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          id?: string
          language?: string | null
          path: string
          project_id: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          id?: string
          language?: string | null
          path?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      creator_lessons: {
        Row: {
          body_md: string
          created_at: string
          id: string
          language: string | null
          level: string
          slug: string
          sort_order: number | null
          starter_code: string | null
          title: string
          track: string
          xp: number | null
        }
        Insert: {
          body_md?: string
          created_at?: string
          id?: string
          language?: string | null
          level?: string
          slug: string
          sort_order?: number | null
          starter_code?: string | null
          title: string
          track?: string
          xp?: number | null
        }
        Update: {
          body_md?: string
          created_at?: string
          id?: string
          language?: string | null
          level?: string
          slug?: string
          sort_order?: number | null
          starter_code?: string | null
          title?: string
          track?: string
          xp?: number | null
        }
        Relationships: []
      }
      creator_progress: {
        Row: {
          code: string | null
          completed_at: string | null
          id: string
          lesson_id: string
          status: string
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          code?: string | null
          completed_at?: string | null
          id?: string
          lesson_id: string
          status?: string
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          code?: string | null
          completed_at?: string | null
          id?: string
          lesson_id?: string
          status?: string
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: []
      }
      creator_tasks: {
        Row: {
          created_at: string
          description: string | null
          due_at: string | null
          id: string
          milestone: string | null
          project_id: string
          sort_order: number | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          milestone?: string | null
          project_id: string
          sort_order?: number | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          milestone?: string | null
          project_id?: string
          sort_order?: number | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      collab_rooms: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          project_id: string | null
          share_code: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          project_id?: string | null
          share_code: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          project_id?: string | null
          share_code?: string
        }
        Relationships: []
      }
      collab_messages: {
        Row: {
          body: string
          created_at: string
          display_name: string
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          display_name?: string
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          display_name?: string
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: []
      }
      research_notes: {
        Row: {
          body: string | null
          citations: Json | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          citations?: Json | null
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          citations?: Json | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      library_flashcards: {
        Row: {
          back: string
          box: number
          content_item_id: string | null
          created_at: string
          difficulty: string
          ease: number
          front: string
          id: string
          next_review_at: string
          source: string
          user_id: string
        }
        Insert: {
          back: string
          box?: number
          content_item_id?: string | null
          created_at?: string
          difficulty?: string
          ease?: number
          front: string
          id?: string
          next_review_at?: string
          source?: string
          user_id: string
        }
        Update: {
          back?: string
          box?: number
          content_item_id?: string | null
          created_at?: string
          difficulty?: string
          ease?: number
          front?: string
          id?: string
          next_review_at?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      library_flashcard_reviews: {
        Row: {
          flashcard_id: string
          id: string
          rating: number
          reviewed_at: string
          user_id: string
        }
        Insert: {
          flashcard_id: string
          id?: string
          rating: number
          reviewed_at?: string
          user_id: string
        }
        Update: {
          flashcard_id?: string
          id?: string
          rating?: number
          reviewed_at?: string
          user_id?: string
        }
        Relationships: []
      }
      library_notes: {
        Row: {
          audio_url: string | null
          color: string | null
          content_item_id: string | null
          created_at: string
          drawing_data: Json | null
          id: string
          kind: string
          page: number
          shared: boolean
          text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          color?: string | null
          content_item_id?: string | null
          created_at?: string
          drawing_data?: Json | null
          id?: string
          kind?: string
          page?: number
          shared?: boolean
          text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_url?: string | null
          color?: string | null
          content_item_id?: string | null
          created_at?: string
          drawing_data?: Json | null
          id?: string
          kind?: string
          page?: number
          shared?: boolean
          text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      library_quiz_results: {
        Row: {
          content_item_id: string | null
          created_at: string
          details: Json
          id: string
          score: number
          scope: string
          total: number
          user_id: string
        }
        Insert: {
          content_item_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          score?: number
          scope?: string
          total?: number
          user_id: string
        }
        Update: {
          content_item_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          score?: number
          scope?: string
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      marketplace_items: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          item_type: string | null
          name: string
          owner_id: string | null
          price_credits: number | null
          tradeable: boolean | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          item_type?: string | null
          name: string
          owner_id?: string | null
          price_credits?: number | null
          tradeable?: boolean | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          item_type?: string | null
          name?: string
          owner_id?: string | null
          price_credits?: number | null
          tradeable?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_installs: {
        Row: {
          id: string
          installed_at: string
          item_id: string
          user_id: string
        }
        Insert: {
          id?: string
          installed_at?: string
          item_id: string
          user_id: string
        }
        Update: {
          id?: string
          installed_at?: string
          item_id?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_battles: {
        Row: {
          challenger_id: string | null
          challenger_name: string | null
          challenger_score: number | null
          created_at: string
          current_question: number | null
          finished_at: string | null
          grade: number | null
          host_id: string
          host_name: string
          host_score: number | null
          id: string
          questions: Json | null
          started_at: string | null
          status: string
          subject: string
          winner_id: string | null
        }
        Insert: {
          challenger_id?: string | null
          challenger_name?: string | null
          challenger_score?: number | null
          created_at?: string
          current_question?: number | null
          finished_at?: string | null
          grade?: number | null
          host_id: string
          host_name: string
          host_score?: number | null
          id?: string
          questions?: Json | null
          started_at?: string | null
          status?: string
          subject: string
          winner_id?: string | null
        }
        Update: {
          challenger_id?: string | null
          challenger_name?: string | null
          challenger_score?: number | null
          created_at?: string
          current_question?: number | null
          finished_at?: string | null
          grade?: number | null
          host_id?: string
          host_name?: string
          host_score?: number | null
          id?: string
          questions?: Json | null
          started_at?: string | null
          status?: string
          subject?: string
          winner_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      margeos_analytics_overview: {
        Args: { _workspace_id?: string }
        Returns: Json
      }
      margeos_analytics_summary: {
        Args: { _since?: string; _workspace_id?: string }
        Returns: {
          category: string
          event: string
          events: number
          total_value: number
        }[]
      }
      margeos_analytics_timeseries: {
        Args: { _days?: number; _workspace_id?: string }
        Returns: {
          category: string
          day: string
          events: number
        }[]
      }
      match_margeos_knowledge: {
        Args: {
          _category?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          category: string
          content: string
          created_at: string
          id: string
          metadata: Json
          similarity: number
          source: string
          tags: string[]
          title: string
          updated_at: string
        }[]
      }
      match_margeos_memory: {
        Args: {
          _workspace_id?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          content: string
          created_at: string
          id: string
          key: string
          metadata: Json
          scope: string
          similarity: number
          updated_at: string
          workspace_id: string
        }[]
      }
    }
    Enums: {
      app_role: "student" | "teacher" | "school" | "admin"
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
      app_role: ["student", "teacher", "school", "admin"],
    },
  },
} as const
