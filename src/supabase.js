import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vvwpjgonmphkoliithgq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2d3BqZ29ubXBoa29saWl0aGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNzAwMDgsImV4cCI6MjA5NDg0NjAwOH0.MHU9oKud0-DkzVKCv0PfDF6kfpBC1n0g7vVoxQQF7ws'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
