/**
 * Controleert of een ADMIN_PASSWORD_HASH bij een wachtwoord hoort.
 *
 * Gebruik dit als /beheer zegt "Wachtwoord klopt niet" terwijl je zeker weet
 * dat je het goede wachtwoord typt. Dan is de hash onderweg beschadigd, en
 * dat zie je hier meteen.
 *
 * Gebruik: npm run beheer:check -- 'jouw wachtwoord' 'scrypt:...:...'
 *
 * Draait volledig lokaal. Er gaat niets over het netwerk.
 */
import { scryptSync, timingSafeEqual } from 'node:crypto';

const [wachtwoord, hash] = process.argv.slice(2);

if (!wachtwoord || !hash) {
  console.error(
    '\nGeef allebei mee, tussen aanhalingstekens:\n' +
    "  npm run beheer:check -- 'jouw wachtwoord' 'scrypt:...:...'\n\n" +
    'Draai dit vanuit de projectmap, dus de map met package.json.\n',
  );
  process.exit(1);
}

/** Lengte die het script altijd oplevert: 16 byte salt + 32 byte hash, hex. */
const VERWACHTE_LENGTE = 'scrypt:'.length + 32 + 1 + 64;

const delen = hash.split(':');
const bevindingen = [];

if (hash.length !== VERWACHTE_LENGTE) {
  bevindingen.push(
    `lengte is ${hash.length}, verwacht ${VERWACHTE_LENGTE}. ` +
    (hash.length < VERWACHTE_LENGTE
      ? 'Er is een stuk afgekapt bij het kopieren.'
      : 'Er staat iets teveel omheen, bijvoorbeeld aanhalingstekens of een spatie.'),
  );
}
if (hash !== hash.trim()) bevindingen.push('er staat een spatie of regeleinde omheen');
if (/^["']|["']$/.test(hash)) bevindingen.push('er staan aanhalingstekens omheen; die horen er niet bij');
if (delen[0] === 'scrypt$' || hash.includes('$')) {
  bevindingen.push('bevat een $; dit is het oude formaat, genereer hem opnieuw met npm run beheer:hash');
}
if (delen.length !== 3) bevindingen.push(`bestaat uit ${delen.length} deel(en) in plaats van 3`);
else if (delen[0] !== 'scrypt') bevindingen.push(`begint met "${delen[0]}" in plaats van "scrypt"`);

/**
 * Zelfde regels als src/lib/beheer-sessie.ts: de lengtes liggen vast.
 * Zou je hier de sleutel afleiden op de lengte van wat is opgeslagen, dan
 * keurt een afgekapte hash zichzelf goed, en dan meldt deze controle "in
 * orde" terwijl inloggen op de site faalt. Precies andersom dus.
 */
const SALT_BYTES = 16;
const HASH_BYTES = 32;

let klopt = false;
try {
  const juisteVorm =
    delen.length === 3 &&
    delen[1].length === SALT_BYTES * 2 &&
    delen[2].length === HASH_BYTES * 2;
  if (juisteVorm) {
    const salt = Buffer.from(delen[1], 'hex');
    const verwacht = Buffer.from(delen[2], 'hex');
    if (salt.length === SALT_BYTES && verwacht.length === HASH_BYTES) {
      klopt = timingSafeEqual(scryptSync(wachtwoord, salt, HASH_BYTES), verwacht);
    } else {
      bevindingen.push('de salt of de hash is geen geldige hex');
    }
  }
} catch {
  bevindingen.push('de salt of de hash is geen geldige hex');
}

console.log('');
if (klopt) {
  console.log('  Deze hash hoort bij dit wachtwoord.');
  console.log('  Werkt inloggen toch niet, dan staat er in Vercel een andere waarde');
  console.log('  dan je hier plakte, of is er na het zetten niet opnieuw gedeployd.\n');
} else {
  console.log('  Deze hash hoort NIET bij dit wachtwoord.\n');
  if (bevindingen.length) {
    console.log('  Wat er mis lijkt:');
    for (const b of bevindingen) console.log(`    - ${b}`);
  } else {
    console.log('  De vorm klopt, dus het is waarschijnlijk een ander wachtwoord');
    console.log('  dan waarmee de hash is gemaakt.');
  }
  console.log('\n  Genereer een nieuwe met:');
  console.log("    npm run beheer:hash -- 'jouw wachtwoord'\n");
  process.exitCode = 1;
}
