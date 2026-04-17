const fs = require('fs');
const p = 'src/features/screens/home/MotionHomePerformance.tsx';
let b = fs.readFileSync(p, 'utf8');

// 1. Fix "ForÃ§ar" and comments
b = b.replace(/Interromper e ForÃ§ar Fim do Plano/g, 'Interromper e Forçar Fim do Plano');
b = b.replace(/CartÃ£o RectilÃ­neo/g, 'Cartão Rectilíneo');
b = b.replace(/CÃ RCULO CENTRAL \(Conta-Movimento â€” Qualidade de ExecuÃ§Ã£o\)/g, 'CÍRCULO CENTRAL (Conta-Movimento — Qualidade de Execução)');
b = b.replace(/Deslize em cÃ­rculo para calibrar/g, 'Deslize em círculo para calibrar');
b = b.replace(/ExercÃ­cio livre\. Sem instruções mapeadas no catálogo biométrico\./g, 'Exercício livre. Sem instruções mapeadas no catálogo biométrico.');

// 2. Fix targetLimb mismatch with source of truth
const oldTargetLimb = `   const getTargetLimb = () => {
      if (!isHighPrecision) return 'o dispositivo';
      const name = (activeBlock?.exercise?.name || '').toLowerCase();
      if (name.includes('bicep') || name.includes('tricep') || name.includes('braÃ§o') || name.includes('supino') || name.includes('remada') || name.includes('ombro') || name.includes('peito') || name.includes('costas')) return 'e sinta no braÃ§o';
      if (name.includes('agacha') || name.includes('leg') || name.includes('perna') || name.includes('gÃ©meo') || name.includes('glÃºteo')) return 'e sinta na perna';
      return 'o braÃ§o';
   };`;

const newTargetLimb = `   const getTargetLimb = () => {
      if (!isHighPrecision) return 'o dispositivo';
      const name = (planState.activeExercise?.name || '').toLowerCase();
      if (name.includes('bicep') || name.includes('tricep') || name.includes('braço') || name.includes('supino') || name.includes('remada') || name.includes('ombro') || name.includes('peito') || name.includes('costas')) return 'e sinta no braço';
      if (name.includes('agacha') || name.includes('leg') || name.includes('perna') || name.includes('gémeo') || name.includes('glúteo')) return 'e sinta na perna';
      return 'o braço';
   };`;
b = b.replace(oldTargetLimb, newTargetLimb);

// fallback text SESSÂO
b = b.replace(/SESSÃƒO/g, 'SESSÃO');

fs.writeFileSync(p, b, 'utf8');
console.log('Final fixes applied successfully.');
