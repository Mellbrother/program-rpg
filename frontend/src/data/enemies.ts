export type EnemyData = {
  id: string;
  name: string;
  spriteKey: string;
  appearance: string;
  trait: string;
  quote: string;
  weakness: string;
  taunts: string[];
};

export const ENEMIES: EnemyData[] = [
  {
    id: 'syntax-error',
    name: 'シンタックスエラー',
    spriteKey: 'enemy-syntax-error',
    appearance: 'ぎざぎざした赤い波形が常に体から漏れている。',
    trait: 'コードの一文字違いを見逃さない潔癖さ。',
    quote: '「セミコロン、忘れてるよ？」',
    weakness: '丁寧なリントとコード整形。',
    taunts: [
      '初期化した？　その変数、まだ undefined のままじゃない？',
      '括弧、閉じ忘れてない？　パーサーが泣いてるよ。',
      'コンパイル通る？　警告を放置してると足元すくわれるよ。'
    ]
  },
  {
    id: 'null-pointer',
    name: 'ヌルポインタ',
    spriteKey: 'enemy-null-pointer',
    appearance: '透き通った青い影が、突然輪郭を失う。',
    trait: '存在しない値を参照させるトリックを好む。',
    quote: '「参照先？　そんなもの初めから無かったさ。」',
    weakness: 'nullチェックとOption型の活用。',
    taunts: [
      'それ Optional にした？　unwrap で自滅しそうだね。',
      'null チェック忘れてない？　落ちる瞬間を待ってるよ。',
      '例外処理、空っぽじゃないよね？　catch してログ捨ててない？'
    ]
  },
  {
    id: 'race-condition',
    name: 'レースコンディション',
    spriteKey: 'enemy-race-condition',
    appearance: '複数の残像が同時に動き、時間が歪む。',
    trait: '同時実行環境での混乱を引き起こすスピード狂。',
    quote: '「早い者勝ち、整合性なんて気にしないさ！」',
    weakness: 'ロックとイミュータブルデータ構造。',
    taunts: [
      'ロック取った？　そのまま書き込みに走るのは危ないよ。',
      'テストは単体だけ？　並列実行で結果ぶれるかもね。',
      'ログ時系列、揃ってる？　デバッグ地獄へようこそ。'
    ]
  }
];

export function pickRandomEnemy(): EnemyData {
  const index = Math.floor(Math.random() * ENEMIES.length);
  return ENEMIES[index];
}
