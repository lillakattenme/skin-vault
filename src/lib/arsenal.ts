import type {Skin} from './types';
export const groups=[
 {name:'Пистолеты',weapons:['Classic','Shorty','Frenzy','Ghost','Sheriff']},
 {name:'Пистолеты-пулемёты',weapons:['Stinger','Spectre']},
 {name:'Дробовики',weapons:['Bucky','Judge']},
 {name:'Винтовки',weapons:['Bulldog','Guardian','Phantom','Vandal']},
 {name:'Снайперские винтовки',weapons:['Marshal','Outlaw','Operator']},
 {name:'Пулемёты',weapons:['Ares','Odin']},
 {name:'Ножи',weapons:['Ножи']}
];
export function arsenalGroups(skins:Skin[]){const known=new Set(groups.flatMap(g=>g.weapons));const extra=[...new Set(skins.map(s=>s.weapon))].filter(w=>!known.has(w));return extra.length?[...groups,{name:'Другое оружие',weapons:extra}]:groups;}
