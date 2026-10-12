/**
 * Google Maps Platform Configuration
 * Utilizes the provisioned API Key and Map ID for @vis.gl/react-google-maps
 */

export const GOOGLE_MAPS_API_KEY: string =
  ((import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyCKEgMStvZ23sROf_cW7-d_VDNsSh1mbY0';

export const GOOGLE_MAPS_MAP_ID: string = 'DEMO_MAP_ID';

export const GMP_ATTRIBUTION_IDS = ['gmp_git_agentskills_v1'];
