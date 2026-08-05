import 'dotenv/config';
import mongoose from 'mongoose';
import { supabaseAdmin } from '../config/supabase';
import { AdminProfile } from '../models/mongodb/AdminProfile';

async function run() {
  const email = process.env.ADMIN_EMAIL || 'adim@email.com';
  const password = process.env.ADMIN_PASSWORD;
  const cityName = process.env.ADMIN_CITY_NAME || 'Cajazeiras';
  const stateCode = process.env.ADMIN_STATE_CODE || 'PB';
  const codigoIbge = process.env.ADMIN_IBGE_CODE || '2503704';
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ensino';
  if (!password) throw new Error('Informe ADMIN_PASSWORD para criar o administrador.');
  if (!supabaseAdmin) throw new Error('SUPABASE_SERVICE_ROLE_KEY nÃ£o configurada.');

  await mongoose.connect(mongoUri);
  try {
    const { data: page, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (listError) throw listError;
    let user = page.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase());
    if (user) {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password,
        email_confirm: true,
        user_metadata: { ...user.user_metadata, name: `Administrador de ${cityName}`, role: 'admin', codigo_ibge: codigoIbge },
      });
      if (error) throw error;
      user = data.user;
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: `Administrador de ${cityName}`, role: 'admin', codigo_ibge: codigoIbge },
      });
      if (error) throw error;
      user = data.user;
    }

    const profile = await AdminProfile.findOneAndUpdate(
      { codigoIbge },
      { userId: user.id, name: `Administrador de ${cityName}`, email, cityName, stateCode, codigoIbge },
      { upsert: true, new: true, runValidators: true },
    );
    const { error: tableError } = await supabaseAdmin.from('usuarios').upsert({
      id: user.id,
      email,
      mongo_profile_id: String(profile._id),
    }, { onConflict: 'id' });
    if (tableError) throw tableError;
    console.log(`Administrador municipal configurado: ${email} - ${cityName}/${stateCode}`);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
