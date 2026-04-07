import { supabase } from './supabase';
// ⚠️ ARCHIVO DEPRECADO POR SEGURIDAD ⚠️
// El frontend NUNCA debe usar la llave Service Role.
// Exportamos el cliente anónimo por compatibilidad temporal si algo aún lo importa.
export const supabaseServiceRole = supabase;
