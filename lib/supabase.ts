import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mqpbhnmxayjjyqlamvrr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xcGJobm14YXlqanlxbGFtdnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MjY5NjQsImV4cCI6MjA0ODQwMjk2NH0.auzveXSaM5tQtIfwTVWu_wvGfbkzLFuGy4fCcQ1aodM'

export const supabase = createClient(supabaseUrl, supabaseKey)
