-- Atualiza ou cria o perfil de admin para karen@adm.com
insert into profiles (id, email, full_name, role)
select id, email, 'Karen (Admin)', 'admin'
from auth.users
where email = 'karen@adm.com'
on conflict (id) do update
  set full_name = excluded.full_name,
      role = excluded.role;

// Script Node.js CommonJS para criar usuário admin no Supabase usando service_role key
// Uso: SUPABASE_URL="https://..." SUPABASE_SERVICE_ROLE_KEY="..." node scripts/create-admin-user.cjs

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('ERRO: Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function run() {
  const email = 'karen@adm.com';
  const password = 'mwf17';
  const full_name = 'Karen (Admin)';
  const role = 'admin';

  try {
    // Tenta buscar usuário existente por email
    let foundUserId = null;
    try {
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) console.warn('Aviso listUsers:', listError.message || listError);
      else if (listData && Array.isArray(listData.users)) {
        const found = listData.users.find(u => u.email === email);
        if (found) foundUserId = found.id;
      }
    } catch (err) {
      console.warn('listUsers falhou:', err);
    }

    if (foundUserId) {
      console.log('Usuário já existe no Auth com id:', foundUserId);
      const { error: upsertErr } = await supabase.from('profiles').upsert({ id: foundUserId, email, full_name, role });
      if (upsertErr) console.error('Erro ao upsert profile:', upsertErr);
      else console.log('Profile atualizado/criado com sucesso.');
      return;
    }

    // Cria usuário no Auth (admin)
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (createError) {
      console.error('Erro ao criar usuário no Auth:', createError.message || createError);
      process.exit(1);
    }

    const createdUser = createData.user || createData;
    console.log('Usuário criado no Auth com id:', createdUser.id);

    // Cria/atualiza profile na tabela profiles
    const { error: upsertError } = await supabase.from('profiles').upsert({
      id: createdUser.id,
      email,
      full_name,
      role
    });

    if (upsertError) {
      console.error('Erro ao criar/upsert profile:', upsertError.message || upsertError);
      process.exit(1);
    }

    console.log('Profile criado/upsert com sucesso. Login pronto.');
  } catch (err) {
    console.error('Erro inesperado:', err);
    process.exit(1);
  }
}

run();
