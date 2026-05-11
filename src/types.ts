/**
 * FX Category Type
 */
export type FxCategory = 'vocal' | 'instrumental' | 'ambience' | 'production';

/**
 * FX Item Interface
 */
export interface FxItem {
    id: string;
    label: string;
    description: string;
}

/**
 * FX Database Structure
 */
export interface FxDatabase {
    vocal: FxItem[];
    instrumental: FxItem[];
    ambience: FxItem[];
    production: FxItem[];
}
