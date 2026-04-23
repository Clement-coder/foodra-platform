# SQL Migration Checklist

## Pre-Migration Checks
- [ ] Backup existing database
- [ ] Verify Supabase project access
- [ ] Check environment variables are set

## Core Schema (Required)
- [ ] schema.sql
- [ ] rls.sql  
- [ ] storage.sql

## Feature Extensions
- [ ] alter_users_profile_fields.sql
- [ ] cart_management.sql
- [ ] escrow_migration.sql
- [ ] rls_escrow.sql
- [ ] delivery_addresses.sql
- [ ] admin_support.sql
- [ ] notifications.sql
- [ ] wallet_funding.sql
- [ ] ratings_comments.sql
- [ ] add_product_unit.sql
- [ ] order_disputes.sql
- [ ] terms_acceptance.sql
- [ ] push_subscriptions.sql

## Latest Features (April 2026)
- [ ] credit_score.sql
- [ ] order_tracking.sql
- [ ] wishlist.sql
- [ ] product_views.sql
- [ ] farmer_verification.sql
- [ ] search_indexes.sql
- [ ] seed.sql (optional)

## Post-Migration
- [ ] Test user registration
- [ ] Test product creation
- [ ] Test order flow
- [ ] Verify RLS policies
- [ ] Check storage buckets
