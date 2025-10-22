import Phaser from 'phaser';
import { pickRandomEnemy, type EnemyData } from '../data/enemies';

const FULL_WIDTH_SPACE = '\u3000';

export class GameScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private player!: Phaser.Physics.Arcade.Sprite;
  private encounterTimer = 0;
  private encounterActive = false;
  private enemySprite?: Phaser.GameObjects.Image;
  private battleMessage?: Phaser.GameObjects.Text;
  private enemyInfo?: Phaser.GameObjects.Text;
  private battleBackdrop?: Phaser.GameObjects.Rectangle;
  private actionPrompt?: Phaser.GameObjects.Text;
  private partyStatusPanel?: Phaser.GameObjects.Rectangle;
  private partyStatusTexts: Phaser.GameObjects.Text[] = [];
  private enemyTauntBubble?: Phaser.GameObjects.Text;
  private attackKey!: Phaser.Input.Keyboard.Key;
  private currentEnemy?: EnemyData;
  private tauntTimerEvent?: Phaser.Time.TimerEvent;
  private tauntIndex = 0;
  private isAwaitingAttack = false;
  private readonly partyMembers = [
    { name: 'プレイヤー', hp: 36, mp: 14, condition: 'ふつう' },
    { name: 'AIアーキ', hp: 30, mp: 22, condition: '集中' },
    { name: 'デバッガ', hp: 24, mp: 28, condition: '冷静' }
  ];

  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    this.generatePlayerTexture();
    this.loadEnemyAssets();
  }

  create(): void {
    this.add.rectangle(160, 90, 320, 180, 0x0f1626).setOrigin(0.5, 0.5);
    this.add
      .grid(160, 90, 320, 180, 16, 16, 0x182235, 0.45, 0x020305, 0.35)
      .setDepth(-1);

    this.player = this.physics.add.sprite(160, 90, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setSize(10, 12).setOffset(3, 4);

    this.physics.world.setBounds(0, 0, 320, 180);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.add
      .text(8, 8, '矢印キー: 移動 / フィールドを探索しよう\nスペースキー: こうげき', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#e0e5ff'
      })
      .setScrollFactor(0);

    this.resetEncounterTimer();
  }

  update(_time: number, delta: number): void {
    if (!this.player) {
      return;
    }

    if (this.encounterActive) {
      this.player.setVelocity(0, 0);
      if (this.isAwaitingAttack && Phaser.Input.Keyboard.JustDown(this.attackKey)) {
        this.resolvePlayerAttack();
      }
      return;
    }

    const speed = 80;
    let vx = 0;
    let vy = 0;

    if (this.cursors.left?.isDown) {
      vx -= speed;
      this.player.setFlipX(true);
    }
    if (this.cursors.right?.isDown) {
      vx += speed;
      this.player.setFlipX(false);
    }
    if (this.cursors.up?.isDown) {
      vy -= speed;
    }
    if (this.cursors.down?.isDown) {
      vy += speed;
    }

    if (vx !== 0 && vy !== 0) {
      const d = Math.SQRT1_2;
      vx *= d;
      vy *= d;
    }

    this.player.setVelocity(vx, vy);

    this.encounterTimer -= delta;
    if (this.encounterTimer <= 0) {
      this.startEncounter();
    }
  }

  private generatePlayerTexture(): void {
    if (this.textures.exists('player')) {
      return;
    }

    this.textures.generate('player', {
      data: [
        '...2...',
        '..111..',
        '.11111.',
        '.11111.',
        '..1.1..',
        '..1.1..',
        '.1...1.',
        '1.....1'
      ],
      pixelWidth: 4,
      pixelHeight: 4,
      palette: {
        0: '#00000000',
        1: '#7bdc4a',
        2: '#394b70'
      }
    });
  }

  private loadEnemyAssets(): void {
    const placeholderPalettes: Record<string, { data: string[]; palette: Record<number, string>; pixelSize?: number }> = {
      'enemy-syntax-error': {
        data: [
          '..3333..',
          '.3....3.',
          '3.33.33.',
          '3.3.3.3.',
          '3.333.3.',
          '.3....3.',
          '..3333..'
        ],
        palette: {
          0: '#00000000',
          3: '#ff557a'
        },
        pixelSize: 4
      },
      'enemy-null-pointer': {
        data: ['.22.22.', '2222222', '22...22', '22.2.22', '2222222', '.22.22.'],
        palette: {
          0: '#00000000',
          2: '#4ad7ff'
        }
      },
      'enemy-race-condition': {
        data: ['11..11', '.1..1.', '..11..', '.1..1.', '11..11', '1....1'],
        palette: {
          0: '#00000000',
          1: '#b18cff'
        }
      }
    };

    Object.entries(placeholderPalettes).forEach(([key, config]) => {
      if (!this.textures.exists(key)) {
        this.textures.generate(key, {
          data: config.data,
          pixelWidth: config.pixelSize ?? 6,
          pixelHeight: config.pixelSize ?? 6,
          palette: config.palette
        });
      }
    });
  }

  private startEncounter(): void {
    this.encounterActive = true;
    this.currentEnemy = pickRandomEnemy();
    this.tauntTimerEvent?.remove(false);
    this.tauntTimerEvent = undefined;
    this.isAwaitingAttack = true;
    this.tauntIndex = 0;

    if (this.currentEnemy) {
      this.showEnemy(this.currentEnemy);
      this.time.delayedCall(1800, () => {
        if (this.isAwaitingAttack) {
          this.beginEnemyTaunts();
        }
      });
    }
  }

  private showEnemy(enemy: EnemyData): void {
    const centerX = 160;
    const centerY = 80;

    this.enemySprite?.destroy();
    this.battleMessage?.destroy();
    this.enemyInfo?.destroy();
    this.battleBackdrop?.destroy();
    this.actionPrompt?.destroy();
    this.enemyTauntBubble?.destroy();
    this.partyStatusPanel?.destroy();
    this.partyStatusTexts.forEach((text) => text.destroy());
    this.partyStatusTexts = [];

    const enemyY = centerY - 20;

    this.enemySprite = this.add
      .image(centerX, enemyY, enemy.spriteKey)
      .setOrigin(0.5)
      .setScale(2.5)
      .setDepth(1);

    this.enemyTauntBubble = this.add
      .text(centerX, enemyY - 50, '', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#f1f4ff',
        backgroundColor: '#111b2f',
        padding: { left: 4, right: 4, top: 2, bottom: 2 },
        align: 'center',
        wordWrap: { width: 130, useAdvancedWrap: true }
      })
      .setOrigin(0.5, 1)
      .setDepth(2)
      .setVisible(false);

    this.battleBackdrop = this.add
      .rectangle(centerX, 150, 304, 60, 0x131b32, 0.92)
      .setOrigin(0.5)
      .setStrokeStyle(1, 0x3a4b6d, 0.8)
      .setDepth(3);

    const dialog = `${enemy.name} が現れた！\n${enemy.quote}`;
    this.battleMessage = this.add
      .text(centerX, 136, dialog, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#f5f6ff',
        align: 'center',
        backgroundColor: '#1a2340',
        padding: { left: 6, right: 6, top: 4, bottom: 4 },
        wordWrap: { width: 280, useAdvancedWrap: true }
      })
      .setOrigin(0.5)
      .setDepth(4);

    this.actionPrompt = this.add
      .text(centerX, 168, 'スペースキー：こうげき', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#c8d9ff',
        align: 'center'
      })
      .setOrigin(0.5)
      .setDepth(4);

    const infoText = `外見: ${enemy.appearance}\n特徴: ${enemy.trait}\n弱点: ${enemy.weakness}`;
    this.enemyInfo = this.add
      .text(190, 112, infoText, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#cde3ff',
        wordWrap: { width: 118, useAdvancedWrap: true }
      })
      .setOrigin(0, 0)
      .setDepth(4);

    this.partyStatusPanel = this.add
      .rectangle(10, 176, 168, 66, 0x0b1224, 0.95)
      .setOrigin(0, 1)
      .setStrokeStyle(1, 0x3a4b6d, 0.9)
      .setDepth(5);

    this.partyStatusTexts = this.partyMembers.map((member, index) =>
      this.add
        .text(18, 118 + index * 16, this.formatPartyMember(member), {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#f7fbff'
        })
        .setOrigin(0, 0)
        .setDepth(6)
    );
  }

  private beginEnemyTaunts(): void {
    const enemy = this.currentEnemy;
    if (!enemy || enemy.taunts.length === 0) {
      return;
    }

    this.tauntTimerEvent?.remove(false);

    this.tauntTimerEvent = this.time.addEvent({
      delay: 2600,
      loop: true,
      callback: () => {
        if (!this.isAwaitingAttack) {
          this.tauntTimerEvent?.remove(false);
          this.tauntTimerEvent = undefined;
          return;
        }

        const line = enemy.taunts[this.tauntIndex % enemy.taunts.length];
        this.tauntIndex += 1;
        this.showEnemyTaunt(`${enemy.name}「${line}」`);
      }
    });
  }

  private updateBattleMessage(message: string): void {
    if (this.battleMessage) {
      this.battleMessage.setText(message);
    }
  }

  private showEnemyTaunt(line: string): void {
    if (!this.enemyTauntBubble) {
      return;
    }

    if (line.trim().length === 0) {
      this.enemyTauntBubble.setVisible(false);
      return;
    }

    this.enemyTauntBubble.setText(line).setVisible(true);
  }

  private resolvePlayerAttack(): void {
    if (!this.currentEnemy || !this.isAwaitingAttack) {
      return;
    }

    const enemy = this.currentEnemy;
    this.isAwaitingAttack = false;
    this.tauntTimerEvent?.remove(false);
    this.tauntTimerEvent = undefined;

    this.updateBattleMessage(`あなたのこうげき！\n${enemy.name} は ${enemy.weakness} に弱かった！`);
    this.showEnemyTaunt('');
    this.actionPrompt?.setText('バトル勝利！');

    this.time.delayedCall(2200, () => {
      this.endEncounter();
    });
  }

  private endEncounter(): void {
    this.encounterActive = false;
    this.enemySprite?.destroy();
    this.battleMessage?.destroy();
    this.enemyInfo?.destroy();
    this.battleBackdrop?.destroy();
    this.actionPrompt?.destroy();
    this.enemyTauntBubble?.destroy();
    this.partyStatusPanel?.destroy();
    this.partyStatusTexts.forEach((text) => text.destroy());
    this.partyStatusTexts = [];
    this.tauntTimerEvent?.remove(false);
    this.enemySprite = undefined;
    this.battleMessage = undefined;
    this.enemyInfo = undefined;
    this.battleBackdrop = undefined;
    this.actionPrompt = undefined;
    this.enemyTauntBubble = undefined;
    this.partyStatusPanel = undefined;
    this.currentEnemy = undefined;
    this.tauntTimerEvent = undefined;
    this.isAwaitingAttack = false;
    this.attackKey.reset();
    this.resetEncounterTimer();
  }

  private formatPartyMember(member: { name: string; hp: number; mp: number; condition: string }): string {
    const hp = member.hp.toString().padStart(3, ' ');
    const mp = member.mp.toString().padStart(3, ' ');
    return `${member.name.padEnd(6, FULL_WIDTH_SPACE)} HP${hp}  MP${mp}  ${member.condition}`;
  }

  private resetEncounterTimer(): void {
    this.encounterTimer = Phaser.Math.Between(4500, 7500);
  }
}
