import { composeSessionState } from '../motionSessionComposer';
import { TrainingPlanDefinition, PlanStatus } from '../../contracts/trainingPlanTypes';

// Mock Plan Creation helper
const mockPlan = (nodes: any[], intent: 'training' | 'rest' | 'none' = 'training'): TrainingPlanDefinition => ({
  planId: 'test_plan_1',
  type: 'progression',
  planIntent: intent,
  focusMuscles: ['chest'],
  expectedDurationMinutes: 45,
  sequence: nodes,
  shortVariantNodes: nodes.length > 0 ? [nodes[0]] : [] // short variant is just first node
});

const nodeA = { nodeId: 'A', exerciseId: 'ex1', name: 'Exercise A', groupTarget: 'A', sets: 1, reps: 1 };
const nodeB = { nodeId: 'B', exerciseId: 'ex2', name: 'Exercise B', groupTarget: 'B', sets: 1, reps: 1 };
const nodeC = { nodeId: 'C', exerciseId: 'ex3', name: 'Exercise C', groupTarget: 'C', sets: 1, reps: 1 };

function assertEqual(actual: any, expected: any, testName: string) {
  if (actual !== expected) {
    throw new Error(`Test [${testName}] failed! Expected ${expected}, got ${actual}`);
  }
}

function runTests() {
  console.log("Running Semantic Tests...");

  // A) plano com 3 exercícios, 0 concluídos -> planStatus = active
  const testA = composeSessionState(mockPlan([nodeA, nodeB, nodeC]), []);
  assertEqual(testA.planStatus, 'active', 'A - Status');
  assertEqual(testA.currentExercise?.nodeId, 'A', 'A - currentEx');
  assertEqual(testA.nextExercise?.nodeId, 'B', 'A - nextEx');
  
  // B) plano com 3 exercícios, 2 concluídos -> planStatus != completed
  const testB = composeSessionState(mockPlan([nodeA, nodeB, nodeC]), ['A', 'B']);
  assertEqual(testB.planStatus, 'between_exercises', 'B - Status');
  assertEqual(testB.currentExercise?.nodeId, 'C', 'B - currentEx');
  
  // C) plano com 3 exercícios, 3 concluídos -> completed, null
  const testC = composeSessionState(mockPlan([nodeA, nodeB, nodeC]), ['A', 'B', 'C']);
  assertEqual(testC.planStatus, 'completed', 'C - Status');
  assertEqual(testC.currentExercise, null, 'C - currentEx null');
  assertEqual(testC.nextExercise, null, 'C - nextEx null');

  // D) plano com duplicados não inflacionam conclusão
  const testD = composeSessionState(mockPlan([nodeA, nodeB, nodeC]), ['A', 'A', 'A', 'B']);
  assertEqual(testD.planStatus, 'between_exercises', 'D - Status (Not completed despite length)');
  assertEqual(testD.currentExercise?.nodeId, 'C', 'D - currentEx C');

  // E) plano de intent rest -> rest_day
  const testE = composeSessionState(mockPlan([], 'rest'), []);
  assertEqual(testE.planStatus, 'rest_day', 'E - Status rest_day');
  
  // E.2) Sem plano (intent none ou plano null) -> no_plan
  const testE2 = composeSessionState(null, []);
  assertEqual(testE2.planStatus, 'no_plan', 'E2 - Status no_plan');

  const testE3 = composeSessionState(mockPlan([], 'none'), []);
  assertEqual(testE3.planStatus, 'no_plan', 'E3 - Status no_plan (intent none)');

  // F) fora do plano 
  const testF = composeSessionState(mockPlan([nodeA, nodeB]), ['X'], undefined, true);
  assertEqual(testF.planStatus, 'out_of_plan', 'F - Status out_of_plan');

  // G) sessão curta (sessionVariant) concluída explicitamente
  // activeVariant = 'short', only A is required
  const testG_Active = composeSessionState(mockPlan([nodeA, nodeB, nodeC]), [], undefined, false, 'short');
  assertEqual(testG_Active.currentExercise?.nodeId, 'A', 'G - short variant starts at A');
  const testG_Complete = composeSessionState(mockPlan([nodeA, nodeB, nodeC]), ['A'], undefined, false, 'short');
  assertEqual(testG_Complete.planStatus, 'completed', 'G - short variant completes with only A');
  assertEqual(testG_Complete.currentExercise, null, 'G - short variant current is null on complete');

  // H) retoma de sessão parcial 
  // Node A and C completed, B is skipped in reality or A was just done. Let's say user completed A. Currently active is B. Then app resumes.
  const testH = composeSessionState(mockPlan([nodeA, nodeB, nodeC]), ['A']);
  assertEqual(testH.planStatus, 'between_exercises', 'H - Partial Resumption maintains state');
  assertEqual(testH.currentExercise?.nodeId, 'B', 'H - Partial Resumption keeps correct progress pointer');

  console.log("All semantic tests passed successfully without false positives.");
}

runTests();
