import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          privy_id: string
          wallet_address: string | null
          name: string | null
          email: string | null
          phone: string | null
          role: 'farmer' | 'buyer' | 'admin' | null
          avatar_url: string | null
          location: string | null
          created_at: string
        }
        Insert: {
          id?: string
          privy_id: string
          wallet_address?: string | null
          name?: string | null
          email?: string | null
          phone?: string | null
          role?: 'farmer' | 'buyer' | 'admin' | null
          avatar_url?: string | null
          location?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          privy_id?: string
          wallet_address?: string | null
          name?: string | null
          email?: string | null
          phone?: string | null
          role?: 'farmer' | 'buyer' | 'admin' | null
          avatar_url?: string | null
          location?: string | null
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          farmer_id: string
          name: string
          category: string
          quantity: number
          price: number
          description: string | null
          image_url: string | null
          location: string | null
          is_available: boolean
          created_at: string
        }
        Insert: {
          id?: string
          farmer_id: string
          name: string
          category: string
          quantity: number
          price: number
          description?: string | null
          image_url?: string | null
          location?: string | null
          is_available?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          farmer_id?: string
          name?: string
          category?: string
          quantity?: number
          price?: number
          description?: string | null
          image_url?: string | null
          location?: string | null
          is_available?: boolean
          created_at?: string
        }
      }
      trainings: {
        Row: {
          id: string
          title: string
          summary: string | null
          description: string | null
          date: string
          mode: 'online' | 'offline'
          location: string | null
          instructor_name: string | null
          capacity: number
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          summary?: string | null
          description?: string | null
          date: string
          mode: 'online' | 'offline'
          location?: string | null
          instructor_name?: string | null
          capacity: number
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          summary?: string | null
          description?: string | null
          date?: string
          mode?: 'online' | 'offline'
          location?: string | null
          instructor_name?: string | null
          capacity?: number
          image_url?: string | null
          created_at?: string
        }
      }
      training_enrollments: {
        Row: {
          id: string
          training_id: string
          user_id: string
          full_name: string
          phone_number: string
          location: string
          created_at: string
        }
        Insert: {
          id?: string
          training_id: string
          user_id: string
          full_name: string
          phone_number: string
          location: string
          created_at?: string
        }
        Update: {
          id?: string
          training_id?: string
          user_id?: string
          full_name?: string
          phone_number?: string
          location?: string
          created_at?: string
        }
      }
      funding_applications: {
        Row: {
          id: string
          user_id: string
          full_name: string
          phone_number: string
          location: string
          farm_size: number
          farm_type: string
          years_of_experience: number
          amount_requested: number
          expected_outcome: string
          status: 'Pending' | 'Approved' | 'Rejected'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          phone_number: string
          location: string
          farm_size: number
          farm_type: string
          years_of_experience: number
          amount_requested: number
          expected_outcome: string
          status?: 'Pending' | 'Approved' | 'Rejected'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          phone_number?: string
          location?: string
          farm_size?: number
          farm_type?: string
          years_of_experience?: number
          amount_requested?: number
          expected_outcome?: string
          status?: 'Pending' | 'Approved' | 'Rejected'
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          buyer_id: string
          total_amount: number
          status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          buyer_id: string
          total_amount: number
          status?: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          buyer_id?: string
          total_amount?: number
          status?: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          price: number
          image_url: string | null
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          price: number
          image_url?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          price?: number
          image_url?: string | null
        }
      }
    }
  }
}
