// Selector del modelo de héroe: por defecto las figuras diorama (herom3d.js); `?hero=old` conserva el héroe facetado anterior (hero3d.js) para comparar.
import {Hero as HeroOld} from './hero3d.js';
import {MiniHero} from './herom3d.js';
export const HeroSel=(typeof location!=='undefined'&&/[?&]hero=old/.test(location.search))?HeroOld:MiniHero;
