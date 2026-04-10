import { supabase } from '@/lib/supabase';

export async function registerBusiness(data: any) {
  const { email, password, businessName, ownerName } = data;

  // 1. Registro en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: ownerName } }
  });

  if (authError) return { error: authError.message };
  const userId = authData.user?.id;

  if (userId) {
    // 2. Crear el Taller (Shop) - Punto 2.1
    const slug = businessName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .insert([
        { 
          name: businessName, 
          slug: slug, 
          owner_id: userId,
          branding_color: '#FF6A2A' 
        }
      ])
      .select()
      .single();

    if (shopError) return { error: shopError.message };

    // 3. Crear Sucursal Inicial - Punto 2.2
    await supabase.from('branches').insert([
      { shop_id: shop.id, name: 'Matriz', is_main_branch: true }
    ]);

    // 4. Crear Suscripción Trial - Punto 2.4
    await supabase.from('subscriptions').insert([
      { shop_id: shop.id, plan_type: 'trial', status: 'active' }
    ]);

    return { success: true, shopSlug: slug };
  }

  return { error: 'Error desconocido en el registro' };
}
