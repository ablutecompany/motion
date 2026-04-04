import { BodyMapModel } from '../contracts/metricsModels';

export type BodyRegion3D = 'upper-front' | 'upper-back' | 'core' | 'lower-front' | 'lower-back' | 'systemic';

export interface RegionIntensity {
  id: BodyRegion3D;
  weight: number; // 0.0 to 1.0 representing relative effort
}

export interface BodyMap3DViewModel {
  dominantRegionLabel: string;
  activeRegions: RegionIntensity[];
}

export class MotionBodyMap3DService {
  /**
   * Maps Motion sys-* identifiers to high-level physical regions.
   * This guarantees visual honesty without clinical faking.
   */
  static extract3DRegionsFromModel(model: BodyMapModel | null, visualState: 'preview' | 'data-light' | 'full'): BodyMap3DViewModel {
    if (!model || visualState === 'preview') {
      return {
        dominantRegionLabel: 'Condicionamento Central',
        activeRegions: [
          { id: 'core', weight: 0.8 },
          { id: 'upper-front', weight: 0.6 }
        ]
      };
    }

    const regionVolumes: Record<BodyRegion3D, number> = {
      'upper-front': 0, 'upper-back': 0, 'core': 0,
      'lower-front': 0, 'lower-back': 0, 'systemic': 0
    };

    model.zones.forEach((z: any) => {
      const vol = z.volume || 1;
      
      if (z.zoneId === 'sys-musc') {
        regionVolumes['upper-front'] += vol * 1.0;
        regionVolumes['upper-back'] += vol * 0.8;
        regionVolumes['core'] += vol * 0.5;
        regionVolumes['lower-front'] += vol * 1.0;
      }
      else if (z.zoneId === 'sys-cardio' || z.zoneId === 'sys-int') {
        regionVolumes['systemic'] += vol * 1.0;
        regionVolumes['lower-front'] += vol * 0.5;
      }
      else if (z.zoneId === 'sys-art') {
        regionVolumes['core'] += vol * 0.8;
        regionVolumes['systemic'] += vol * 0.4;
      }
    });

    const maxVol = Math.max(...Object.values(regionVolumes), 1);
    const activeRegions: RegionIntensity[] = [];
    
    (Object.keys(regionVolumes) as BodyRegion3D[]).forEach(k => {
      if (regionVolumes[k] > 0) {
        activeRegions.push({ id: k, weight: regionVolumes[k] / maxVol });
      }
    });

    return {
      dominantRegionLabel: model.dominantSystemLabel || 'Sistémico Integrado',
      activeRegions
    };
  }
}
