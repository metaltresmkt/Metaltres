import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function timeToMins(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function minsToTime(mins: number) {
  const h = Math.floor(mins / 60).toString().padStart(2, '0')
  const m = (mins % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const payload = await req.json()
    const { action, clinic_id } = payload

    if (!clinic_id) {
      return new Response(JSON.stringify({ error: 'clinic_id is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    if (action === 'get_availability') {
      const { date, doctor_id } = payload
      
      if (!date) {
        return new Response(JSON.stringify({ error: 'date is required' }), {
           headers: { ...corsHeaders, 'Content-Type': 'application/json' },
           status: 400 
        })
      }

      // Fetch doctors
      let doctorsQuery = supabaseClient
        .from('doctors')
        .select('id, user_id, name, working_hours, consultation_duration, days_off, users(full_name)')
        .eq('clinic_id', clinic_id)
        .eq('is_active', true)

      if (doctor_id) {
        doctorsQuery = doctorsQuery.eq('id', doctor_id)
      }

      const { data: doctors, error: doctorsError } = await doctorsQuery
      if (doctorsError) throw doctorsError

      // Get day of week (0=Sun, 6=Sat) safely manually parsing YYYY-MM-DD
      const [year, month, day] = date.split('-').map(Number)
      const localDate = new Date(year, month - 1, day)
      const dayOfWeek = localDate.getDay().toString()

      // Fetch existing appointments for the date
      let apptQuery = supabaseClient
         .from('appointments')
         .select('time, doctor_id')
         .eq('clinic_id', clinic_id)
         .eq('date', date)
         .not('status', 'in', '("cancelado", "faltou")')

      if (doctor_id) {
        apptQuery = apptQuery.eq('doctor_id', doctor_id)
      }

      const { data: appointments, error: apptError } = await apptQuery
      if (apptError) throw apptError

      const availability = doctors.map(doc => {
        // 1. Check if the date is a day off
        if (doc.days_off && doc.days_off.includes(date)) {
           return {
             doctor_id: doc.id,
             doctor_name: doc.name || doc.users?.full_name || 'Médico sem nome',
             available_slots: []
           }
        }

        // 2. Generate slots from working_hours based on consultation_duration
        const duration = doc.consultation_duration || 30
        const shifts = doc.working_hours?.[dayOfWeek] || []
        let doctorSlots: string[] = []

        shifts.forEach((shift: any) => {
           let currentMins = timeToMins(shift.start)
           const endMins = timeToMins(shift.end)

           while (currentMins + duration <= endMins) {
             doctorSlots.push(minsToTime(currentMins))
             currentMins += duration
           }
        })

        // 3. Filter out booked times
        const bookedTimes = appointments
          .filter(a => a.doctor_id === doc.id)
          .map(a => a.time.toString().substring(0, 5))

        const availableSlots = doctorSlots.filter(slot => !bookedTimes.includes(slot))
        
        return {
          doctor_id: doc.id,
          doctor_name: doc.name || doc.users?.full_name || 'Médico sem nome',
          available_slots: availableSlots
        }
      })

      const readable_summary = availability.map(a => {
        if (a.available_slots.length === 0) return `${a.doctor_name}: Sem horários disponíveis.`
        return `${a.doctor_name}: Horários disponíveis às ${a.available_slots.join(', ')}.`
      }).join('\n')

      return new Response(JSON.stringify({ date, availability, readable_summary }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })

    } else if (action === 'book_appointment') {
      const { doctor_id, date, time, patient_name, patient_phone } = payload

      if (!doctor_id || !date || !time || !patient_name || !patient_phone) {
        return new Response(JSON.stringify({ error: 'Missing required fields (doctor_id, date, time, patient_name, patient_phone)' }), {
           headers: { ...corsHeaders, 'Content-Type': 'application/json' },
           status: 400 
        })
      }

      // 1. Resolve Patient
      let patientId = null;
      // Check if patient exists with this phone in this clinic
      const { data: existingPatient } = await supabaseClient
        .from('patients')
        .select('id')
        .eq('clinic_id', clinic_id)
        .eq('phone', patient_phone)
        .maybeSingle()

      if (existingPatient) {
        patientId = existingPatient.id
      } else {
        // Insert new patient
        const { data: newPatient, error: newPatientError } = await supabaseClient
          .from('patients')
          .insert({
            clinic_id: clinic_id,
            name: patient_name,
            phone: patient_phone,
          })
          .select('id')
          .single()
        
        if (newPatientError) throw newPatientError
        patientId = newPatient.id
      }

      // 2. Double check slot availability
      const { data: conflictingAppt } = await supabaseClient
         .from('appointments')
         .select('id')
         .eq('clinic_id', clinic_id)
         .eq('doctor_id', doctor_id)
         .eq('date', date)
         .eq('time', time)
         .not('status', 'in', '("cancelado", "faltou")')
         .maybeSingle()

      if (conflictingAppt) {
        return new Response(JSON.stringify({ error: 'Time slot is already booked' }), {
           headers: { ...corsHeaders, 'Content-Type': 'application/json' },
           status: 409 // Conflict
        })
      }

      // 3. Create Appointment
      const { data: newAppointment, error: apptError } = await supabaseClient
        .from('appointments')
        .insert({
          clinic_id: clinic_id,
          patient_id: patientId,
          doctor_id: doctor_id,
          date: date,
          time: time,
          status: 'pendente', // Ou confirmado, ajustável depois
          source: 'ia'
        })
        .select()
        .single()
      
      if (apptError) throw apptError

      // 4. Update Lead (Optional, but good for funnel tracking)
      // If we find an active lead with this phone, set the converted_patient_id
      const { data: leads } = await supabaseClient
        .from('leads')
        .select('id')
        .eq('clinic_id', clinic_id)
        .eq('phone', patient_phone)
        .is('converted_patient_id', null)
      
      if (leads && leads.length > 0) {
        await supabaseClient
          .from('leads')
          .update({ converted_patient_id: patientId })
          .in('id', leads.map(l => l.id))
      }

      const readable_summary = `Agendamento realizado com sucesso para ${patient_name} no dia ${date} às ${time}.`

      return new Response(JSON.stringify({ success: true, appointment: newAppointment, readable_summary }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })

    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
