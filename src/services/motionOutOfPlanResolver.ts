export const detectOutOfPlanDivergence = (executedId: string, plannedId: string) => {
  return executedId !== plannedId;
};
