export type EnemyData = {
  id: string;
  name: string;
  spriteKey: string;
  appearance: string;
  trait: string;
  quote: string;
  weakness: string;
};

export const ENEMIES: EnemyData[] = [
  {
    id: 'syntax-error',
    name: 'シンタックスエラー',
    spriteKey: 'enemy-syntax-error',
    appearance: 'ぎざぎざした赤い波形が常に体から漏れている。',
    trait: 'コードの一文字違いを見逃さない潔癖さ。',
    quote: '「セミコロン、忘れてるよ？」',
    weakness: '丁寧なリントとコード整形。'
  },
  {
    id: 'null-pointer',
    name: 'ヌルポインタ',
    spriteKey: 'enemy-null-pointer',
    appearance: '透き通った青い影が、突然輪郭を失う。',
    trait: '存在しない値を参照させるトリックを好む。',
    quote: '「参照先？　そんなもの初めから無かったさ。」',
    weakness: 'nullチェックとOption型の活用。'
  },
  {
    id: 'race-condition',
    name: 'レースコンディション',
    spriteKey: 'enemy-race-condition',
    appearance: '複数の残像が同時に動き、時間が歪む。',
    trait: '同時実行環境での混乱を引き起こすスピード狂。',
    quote: '「早い者勝ち、整合性なんて気にしないさ！」',
    weakness: 'ロックとイミュータブルデータ構造。'
  }
];

export function pickRandomEnemy(): EnemyData {
  const index = Math.floor(Math.random() * ENEMIES.length);
  return ENEMIES[index];
}
