export type Origin='battlepass'|'agent'|'event'|'store'|'unknown';
export type Skin={id:string;name:string;weapon:string;image:string;tier:string|null;theme:string|null;price:number|null;priceKind:'offer'|'tier'|'unknown';origin:Origin;levels:string[]};
export type Selection={skinId:string;owned:boolean;wished:boolean;priceOverride?:number|null};
export type Catalog={skins:Skin[];updatedAt:string;schemaVersion?:number;stale?:boolean;notice?:string};
