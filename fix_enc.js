const fs = require('fs');
const p = 'src/features/screens/home/MotionHomePerformance.tsx';
let b = fs.readFileSync(p, 'utf8');

// The corrupted variants observed in output:
const replacements = [
  ['S%RIES', 'SÉRIES'],
  ['SÃ‰RIES', 'SÉRIES'],
  ['crculo', 'círculo'],
  ['cÃrculo', 'círculo'],
  ['INSTRU ES T%CNICAS', 'INSTRUÇÕES TÉCNICAS'],
  ['INSTRUÃ‡Ã•ES TÃ‰CNICAS', 'INSTRUÇÕES TÉCNICAS'],
  ['LOCALIZAǟO', 'LOCALIZAÇÃO'],
  ['LOCALIZAÃ‡ÃƒO', 'LOCALIZAÇÃO'],
  ['TELEM"VEL', 'TELEMÓVEL'],
  ['TELEMÃ“VEL', 'TELEMÓVEL'],
  ['Exerccio', 'Exercício'],
  ['ExercÃcio', 'Exercício'],
  ['instrues', 'instruções'],
  ['instruÃ§Ãµes', 'instruções'],
  ['InstruÃ§Ãµes', 'Instruções'],
  ['catǭlogo', 'catálogo'],
  ['catÃ¡logo', 'catálogo'],
  ['biomǸtrico', 'biométrico'],
  ['biomÃ©trico', 'biométrico'],
  ['instruǜo', 'instrução'],
  ['instruÃ§Ã£o', 'instrução'],
  ['Instrues', 'Instruções']
];

for (const [bad, good] of replacements) {
    b = b.split(bad).join(good);
}

fs.writeFileSync(p, b, 'utf8');
console.log('Fix applied.');
