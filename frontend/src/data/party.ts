export type PartyMember = {
  name: string;
  job: string;
  hp: number;
  mp: number;
};

export const PARTY_MEMBERS: PartyMember[] = [
  { name: 'マルス', job: 'せんし', hp: 172, mp: 48 },
  { name: 'ふじこ', job: 'まほうつかい', hp: 138, mp: 120 },
  { name: 'ひろゆき', job: 'そうりょ', hp: 149, mp: 88 },
  { name: 'かんぺき', job: 'プログラマ', hp: 163, mp: 56 }
];
