/**
 * Genereert de scrypt-hash voor ADMIN_PASSWORD_HASH.
 * Gebruik: npm run beheer:hash -- 'jouw wachtwoord'
 */
import { scryptSync, randomBytes } from 'node:crypto';

const wachtwoord = process.argv[2];
if (!wachtwoord || wachtwoord.length < 12) {
  console.error(
    'Geef een wachtwoord van minimaal 12 tekens.\n\n' +
    'Draai dit vanuit de projectmap, dus de map met package.json:\n' +
    "  npm run beheer:hash -- 'jouw wachtwoord'\n",
  );
  process.exit(1);
}
const salt = randomBytes(16);
const hash = scryptSync(wachtwoord, salt, 32);
console.log('\nZet dit in Vercel als ADMIN_PASSWORD_HASH:\n');
// Dubbele punt als scheidingsteken, geen $: dotenv leest een $ als
// variabele en eet de salt op. Zie src/lib/beheer-sessie.ts.
console.log(`scrypt:${salt.toString('hex')}:${hash.toString('hex')}\n`);
console.log('Genereer daarnaast een AUTH_SECRET van minimaal 32 tekens:\n');
console.log(randomBytes(32).toString('hex'), '\n');
