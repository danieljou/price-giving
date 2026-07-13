/**
 * Sets (or replaces) the confirmed phone number of an existing auth user,
 * identified by email. Usage:
 *
 *   npm run user:set-phone -- rostand@gmail.com 655123456
 *
 * The number is normalized to E.164 (+237 assumed when no country code),
 * and marked as confirmed so phone+password sign-in works immediately.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createServiceClient } from "../supabase/service";
import { isPhoneIdentifier, normalizePhone } from "../../app/login/schema";

async function main() {
  const [email, rawPhone] = process.argv.slice(2);
  if (!email || !rawPhone) {
    console.error("Usage: npm run user:set-phone -- <email> <téléphone>");
    process.exit(1);
  }
  if (!isPhoneIdentifier(rawPhone)) {
    console.error(`Numéro invalide : "${rawPhone}"`);
    process.exit(1);
  }
  const phone = normalizePhone(rawPhone);

  const supabase = createServiceClient();

  // Look the user up by email (paginated scan is fine at admin-account scale)
  const { data, error: listError } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });
  if (listError) throw listError;
  const user = data.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  if (!user) {
    console.error(`Aucun utilisateur avec l'email ${email}.`);
    process.exit(1);
  }

  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    phone,
    phone_confirm: true,
  });
  if (error) throw error;

  console.log(`Téléphone de ${email} défini sur ${phone} (confirmé).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
