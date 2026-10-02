import type {Selection} from './types';
export function winnerAction(guest:boolean,selection?:Selection){return guest?'viewer':selection?.owned?'owned':selection?.wished?'wished':'add';}
