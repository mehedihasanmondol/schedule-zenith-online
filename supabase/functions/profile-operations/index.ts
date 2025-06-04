
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProfileOperationRequest {
  operation: 'paginate' | 'export'
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  format?: 'csv' | 'json'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { operation, page = 1, pageSize = 10, search = '', sortBy = 'created_at', sortOrder = 'desc', format = 'json' }: ProfileOperationRequest = await req.json()

    console.log('Profile operation request:', { operation, page, pageSize, search, sortBy, sortOrder, format })

    // Build the query
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })

    // Apply search filter
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,role.ilike.%${search}%`)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    if (operation === 'paginate') {
      // Apply pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data: profiles, error, count } = await query

      if (error) {
        console.error('Error fetching profiles:', error)
        throw error
      }

      return new Response(
        JSON.stringify({
          data: profiles,
          pagination: {
            page,
            pageSize,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / pageSize)
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    } else if (operation === 'export') {
      // Get all data for export (remove pagination)
      const { data: profiles, error } = await query

      if (error) {
        console.error('Error fetching profiles for export:', error)
        throw error
      }

      if (format === 'csv') {
        // Generate CSV
        const headers = ['ID', 'Full Name', 'Email', 'Phone', 'Role', 'Employment Type', 'Hourly Rate', 'Salary', 'Is Active', 'Start Date', 'Created At']
        const csvRows = [headers.join(',')]

        profiles?.forEach(profile => {
          const row = [
            profile.id,
            `"${profile.full_name || ''}"`,
            `"${profile.email || ''}"`,
            `"${profile.phone || ''}"`,
            profile.role,
            profile.employment_type || '',
            profile.hourly_rate || 0,
            profile.salary || 0,
            profile.is_active,
            profile.start_date || '',
            profile.created_at
          ]
          csvRows.push(row.join(','))
        })

        const csvContent = csvRows.join('\n')
        
        return new Response(csvContent, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="profiles-${new Date().toISOString().split('T')[0]}.csv"`
          },
          status: 200,
        })
      } else {
        // Return JSON export
        return new Response(
          JSON.stringify(profiles, null, 2),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Content-Disposition': `attachment; filename="profiles-${new Date().toISOString().split('T')[0]}.json"`
            },
            status: 200,
          },
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid operation' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )

  } catch (error) {
    console.error('Profile operation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
