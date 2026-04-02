export const analyticsService = {
  track: (eventName: string, properties: Record<string, any> = {}) => {
    // TODO: Enviar pelo canal de telemetria definido pela shell
    console.debug(`[AnalyticsService] Track: ${eventName}`, properties);
  },
  
  error: (errorName: string, errorObj: any) => {
    console.error(`[AnalyticsService] Error: ${errorName}`, errorObj);
  }
};
