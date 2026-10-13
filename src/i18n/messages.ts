import { DEFAULT_TEAM_NAMES, sanitizeTeamName } from '../domain/names';
import { RULES_SUMMARY } from '../domain/rules';
import type { TeamId } from '../domain/types';
import { LANGS, type Lang } from './locale';

export interface Messages {
  undo: string;
  history: string;
  resume: string;
  endMatch: string;
  newMatch: string;
  ended: string;
  win: string;
  setLabel: string;
  finalScore: string;
  serveOpen: string;
  serveNamed: string;
  tiebreak: string;
  tiebreakWho: string;
  saveFailed: string;
  historyEmpty: string;
  rules: string;
  liveEnded: string;
  liveWin: string;
  resetTitle: string;
  resetBody: string;
  resetConfirm: string;
  endTitle: string;
  endBody: string;
  endConfirm: string;
  cancel: string;
  langMenu: string;
  langDe: string;
  langEn: string;
  langEs: string;
  langPt: string;
  decrement: string;
  increment: string;
  serveSet: string;
  serveClear: string;
  teamName: string;
  gameFor: string;
  gameBack: string;
  eventSet: string;
  eventName: string;
  eventNew: string;
  eventEnd: string;
  eventResume: string;
  eventServeOpen: string;
  eventServe: string;
  eventChange: string;
  fatalTitle: string;
  fatalReload: string;
  fatalNote: string;
  metaDescription: string;
  manifestDescription: string;
  teamA: string;
  teamB: string;
}

export const messages = {
  de: {
    undo: 'Rückgängig',
    history: 'Verlauf',
    resume: 'Fortsetzen',
    endMatch: 'Spiel beenden',
    newMatch: 'Neues Spiel',
    ended: 'Beendet',
    win: 'Sieg · {name}',
    setLabel: 'Satz {n}',
    finalScore: 'Endstand',
    serveOpen: '«Aufschlag offen»',
    serveNamed: '«Aufschlag {mark}»',
    tiebreak: 'Tiebreak',
    tiebreakWho: 'Tiebreak · {who} beginnt, danach je 2',
    saveFailed: 'Speichern auf diesem Gerät ist fehlgeschlagen.',
    historyEmpty: 'Noch keine Änderungen.',
    rules: RULES_SUMMARY,
    liveEnded: 'Spiel beendet. Endstand. {score}.',
    liveWin: 'Sieg für {name}. {serve}.',
    resetTitle: 'Neues Spiel?',
    resetBody: 'Der Spielstand wird zurückgesetzt. Die Teamnamen bleiben erhalten.',
    resetConfirm: 'Zurücksetzen',
    endTitle: 'Spiel beenden?',
    endBody: 'Der Endstand bleibt stehen. Plus, Minus, Sätze, Aufschlag und Namen sind gesperrt, bis das Spiel fortgesetzt wird.',
    endConfirm: 'Beenden',
    cancel: 'Abbrechen',
    langMenu: 'Sprache',
    langDe: 'Deutsch',
    langEn: 'Englisch',
    langEs: 'Spanisch',
    langPt: 'Portugiesisch',
    decrement: '{name}: ein Game abziehen',
    increment: '{name}: ein Game hinzufügen',
    serveSet: 'Aufschlag {mark} für {name}',
    serveClear: 'Aufschlag offen lassen, {name}',
    teamName: 'Teamname',
    gameFor: 'Game für {team}',
    gameBack: 'Game {team} zurück',
    eventSet: 'Satz {n}',
    eventName: 'Name {team} · {name}',
    eventNew: 'Neues Spiel',
    eventEnd: 'Spiel beendet',
    eventResume: 'Fortsetzen',
    eventServeOpen: 'Aufschlag offen',
    eventServe: 'Aufschlag {mark}',
    eventChange: 'Änderung',
    fatalTitle: 'Padel Counter konnte die Anzeige nicht laden.',
    fatalReload: 'Neu laden',
    fatalNote: 'Der gespeicherte Spielstand auf diesem Gerät wird dabei gelöscht.',
    metaDescription: 'Padel Counter zählt Games offline auf diesem Gerät. Kein Konto, kein Server.',
    manifestDescription: 'Games-Zähler für Padel. Offline und nur auf diesem Gerät.',
    teamA: 'Team A',
    teamB: 'Team B',
  },
  en: {
    undo: 'Undo',
    history: 'History',
    resume: 'Resume',
    endMatch: 'End match',
    newMatch: 'New match',
    ended: 'Ended',
    win: 'Win · {name}',
    setLabel: 'Set {n}',
    finalScore: 'Final score',
    serveOpen: '«Serve open»',
    serveNamed: '«Serve {mark}»',
    tiebreak: 'Tiebreak',
    tiebreakWho: 'Tiebreak · {who} starts, then two each',
    saveFailed: 'Saving on this device failed.',
    historyEmpty: 'No changes yet.',
    rules: 'Set won at 6 games with a lead of 2, at 7–5, or 7–6 after 6–6. Match: best of 3. Serve is optional (A1, B1, A2, B2). Tap a set to correct it.',
    liveEnded: 'Match ended. Final score. {score}.',
    liveWin: 'Win for {name}. {serve}.',
    resetTitle: 'New match?',
    resetBody: 'The score is reset. The team names stay.',
    resetConfirm: 'Reset',
    endTitle: 'End match?',
    endBody: 'The final score stays. Plus, minus, sets, serve and names stay locked until the match resumes.',
    endConfirm: 'End',
    cancel: 'Cancel',
    langMenu: 'Language',
    langDe: 'German',
    langEn: 'English',
    langEs: 'Spanish',
    langPt: 'Portuguese',
    decrement: '{name}: remove one game',
    increment: '{name}: add one game',
    serveSet: 'Serve {mark} for {name}',
    serveClear: 'Leave the serve open, {name}',
    teamName: 'Team name',
    gameFor: 'Game for {team}',
    gameBack: 'Game {team} back',
    eventSet: 'Set {n}',
    eventName: 'Name {team} · {name}',
    eventNew: 'New match',
    eventEnd: 'Match ended',
    eventResume: 'Resume',
    eventServeOpen: 'Serve open',
    eventServe: 'Serve {mark}',
    eventChange: 'Change',
    fatalTitle: 'Padel Counter could not show the score.',
    fatalReload: 'Reload',
    fatalNote: 'The score saved on this device will be deleted.',
    metaDescription: 'Padel Counter tracks games offline on this device. No account, no server.',
    manifestDescription: 'Game counter for padel. Offline and only on this device.',
    teamA: 'Team A',
    teamB: 'Team B',
  },
  es: {
    undo: 'Deshacer',
    history: 'Historial',
    resume: 'Continuar',
    endMatch: 'Terminar',
    newMatch: 'Partido nuevo',
    ended: 'Terminado',
    win: 'Victoria · {name}',
    setLabel: 'Set {n}',
    finalScore: 'Marcador final',
    serveOpen: '«Saque libre»',
    serveNamed: '«Saque {mark}»',
    tiebreak: 'Tiebreak',
    tiebreakWho: 'Tiebreak · empieza {who}, luego 2 cada uno',
    saveFailed: 'No se pudo guardar en este dispositivo.',
    historyEmpty: 'Todavía no hay cambios.',
    rules: 'Set ganado con 6 games y 2 de ventaja, 7-5, o 7-6 tras 6-6. Partido: al mejor de 3. Saque opcional (A1, B1, A2, B2). Toca un set para corregirlo.',
    liveEnded: 'Partido terminado. Marcador final. {score}.',
    liveWin: 'Victoria de {name}. {serve}.',
    resetTitle: '¿Partido nuevo?',
    resetBody: 'El marcador se reinicia. Los nombres de los equipos se quedan.',
    resetConfirm: 'Reiniciar',
    endTitle: '¿Terminar partido?',
    endBody: 'El marcador final se queda. Más, menos, sets, saque y nombres quedan bloqueados hasta continuar.',
    endConfirm: 'Terminar',
    cancel: 'Cancelar',
    langMenu: 'Idioma',
    langDe: 'Alemán',
    langEn: 'Inglés',
    langEs: 'Español',
    langPt: 'Portugués',
    decrement: '{name}: quitar un game',
    increment: '{name}: sumar un game',
    serveSet: 'Saque {mark} para {name}',
    serveClear: 'Dejar el saque libre, {name}',
    teamName: 'Nombre del equipo',
    gameFor: 'Game para {team}',
    gameBack: 'Game {team} atrás',
    eventSet: 'Set {n}',
    eventName: 'Nombre {team} · {name}',
    eventNew: 'Partido nuevo',
    eventEnd: 'Partido terminado',
    eventResume: 'Continuar',
    eventServeOpen: 'Saque libre',
    eventServe: 'Saque {mark}',
    eventChange: 'Cambio',
    fatalTitle: 'Padel Counter no pudo mostrar el marcador.',
    fatalReload: 'Recargar',
    fatalNote: 'El marcador guardado en este dispositivo se borrará.',
    metaDescription: 'Padel Counter cuenta games sin conexión en este dispositivo. Sin cuenta ni servidor.',
    manifestDescription: 'Contador de games de pádel. Sin conexión y solo en este dispositivo.',
    teamA: 'Equipo A',
    teamB: 'Equipo B',
  },
  pt: {
    undo: 'Desfazer',
    history: 'Histórico',
    resume: 'Continuar',
    endMatch: 'Encerrar',
    newMatch: 'Jogo novo',
    ended: 'Encerrado',
    win: 'Vitória · {name}',
    setLabel: 'Set {n}',
    finalScore: 'Placar final',
    serveOpen: '«Saque aberto»',
    serveNamed: '«Saque {mark}»',
    tiebreak: 'Tiebreak',
    tiebreakWho: 'Tiebreak · {who} começa, depois 2 cada',
    saveFailed: 'Não foi possível salvar neste aparelho.',
    historyEmpty: 'Ainda não há mudanças.',
    rules: 'Set ganho com 6 games e 2 de vantagem, 7-5, ou 7-6 após 6-6. Partida: melhor de 3. Saque opcional (A1, B1, A2, B2). Toque um set para corrigir.',
    liveEnded: 'Jogo encerrado. Placar final. {score}.',
    liveWin: 'Vitória de {name}. {serve}.',
    resetTitle: 'Jogo novo?',
    resetBody: 'O placar é zerado. Os nomes dos times ficam.',
    resetConfirm: 'Zerar',
    endTitle: 'Encerrar jogo?',
    endBody: 'O placar final fica. Mais, menos, sets, saque e nomes ficam bloqueados até continuar.',
    endConfirm: 'Encerrar',
    cancel: 'Cancelar',
    langMenu: 'Idioma',
    langDe: 'Alemão',
    langEn: 'Inglês',
    langEs: 'Espanhol',
    langPt: 'Português',
    decrement: '{name}: tirar um game',
    increment: '{name}: somar um game',
    serveSet: 'Saque {mark} para {name}',
    serveClear: 'Deixar o saque aberto, {name}',
    teamName: 'Nome do time',
    gameFor: 'Game para {team}',
    gameBack: 'Game {team} de volta',
    eventSet: 'Set {n}',
    eventName: 'Nome {team} · {name}',
    eventNew: 'Jogo novo',
    eventEnd: 'Jogo encerrado',
    eventResume: 'Continuar',
    eventServeOpen: 'Saque aberto',
    eventServe: 'Saque {mark}',
    eventChange: 'Mudança',
    fatalTitle: 'O Padel Counter não conseguiu mostrar o placar.',
    fatalReload: 'Recarregar',
    fatalNote: 'O placar salvo neste aparelho será apagado.',
    metaDescription: 'Padel Counter conta games offline neste aparelho. Sem conta e sem servidor.',
    manifestDescription: 'Contador de games de padel. Offline e só neste aparelho.',
    teamA: 'Time A',
    teamB: 'Time B',
  },
} satisfies Record<Lang, Messages>;

export function fill(template: string, vars: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''));
}

export function defaultTeamNames(lang: Lang): { readonly a: string; readonly b: string } {
  const text = messages[lang];
  return { a: text.teamA, b: text.teamB };
}

/** Empty or unsafe drafts use the language default. A typed "Team A" stays as typed. */
export function localizedTeamName(lang: Lang, team: TeamId, draft: string): string {
  const cleaned = sanitizeTeamName(draft, team);
  const generic = DEFAULT_TEAM_NAMES[team];
  if (cleaned === generic && draft.trim() !== generic) return defaultTeamNames(lang)[team];
  return cleaned;
}

/** Only an untouched default pair follows the language. Custom names stay. */
export function defaultNamesForLanguageSwitch(
  nameA: string,
  nameB: string,
  lang: Lang,
): { readonly a: string; readonly b: string } | null {
  const known = LANGS.some((code) => {
    const defaults = defaultTeamNames(code);
    return defaults.a === nameA && defaults.b === nameB;
  });
  if (!known) return null;
  const next = defaultTeamNames(lang);
  if (nameA === next.a && nameB === next.b) return null;
  return next;
}

const langLabel: Record<Lang, keyof Messages> = {
  de: 'langDe',
  en: 'langEn',
  es: 'langEs',
  pt: 'langPt',
};

export function languageName(text: Messages, lang: Lang): string {
  return text[langLabel[lang]];
}
