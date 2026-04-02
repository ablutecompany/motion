import { ContextSnapshot, HistoryContext } from '../contracts/types';

export const historyContextResolver = {
  intercept: (snapshot: ContextSnapshot): HistoryContext => {
    const isHistory = Boolean(snapshot.selectedHistoryEntry);

    if (!isHistory) {
      return { isHistoryMode: false };
    }

    // TODO: Mapear o payload antigo recebido no selectedHistoryEntry
    return {
      isHistoryMode: true,
      historicalDate: snapshot.selectedHistoryEntry,
      historicalPlan: undefined // Placeholder: requer fetch à API local ou payload
    };
  }
};
