import Phaser from 'phaser';
import { pickRandomEnemy, type EnemyData } from '../data/enemies';
import { PARTY_MEMBERS } from '../data/party';

export class GameScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private player!: Phaser.Physics.Arcade.Sprite;
  private encounterTimer = 0;
  private encounterActive = false;
  private enemySprite?: Phaser.GameObjects.Image;
  private enemyDialog?: Phaser.GameObjects.Text;
  private enemyInfo?: Phaser.GameObjects.Text;
  private battleObjects: Phaser.GameObjects.GameObject[] = [];

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

    this.add
      .text(8, 8, '矢印キー: 移動 / フィールドを探索しよう', {
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
    const enemy = pickRandomEnemy();

    this.showEnemy(enemy);

    this.time.delayedCall(3600, () => {
      this.endEncounter();
    });
  }

  private showEnemy(enemy: EnemyData): void {
    const centerX = 160;
    const centerY = 82;

    this.clearBattleObjects();

    this.enemySprite?.destroy();
    this.enemyDialog?.destroy();
    this.enemyInfo?.destroy();

    this.createBattleLayout(enemy);

    this.enemySprite = this.add
      .image(centerX, centerY, enemy.spriteKey)
      .setOrigin(0.5)
      .setScale(2.8)
      .setDepth(4);
  }

  private endEncounter(): void {
    this.encounterActive = false;
    this.clearBattleObjects();
    this.enemySprite?.destroy();
    this.enemySprite = undefined;
    this.enemyDialog = undefined;
    this.enemyInfo = undefined;
    this.resetEncounterTimer();
  }

  private resetEncounterTimer(): void {
    this.encounterTimer = Phaser.Math.Between(4500, 7500);
  }

  private createBattleLayout(enemy: EnemyData): void {
    const overlay = this.add
      .rectangle(160, 90, 320, 180, 0x050a1a, 0.82)
      .setDepth(1);
    this.registerBattleObject(overlay);

    const panelColor = 0x111d3a;
    const borderColor = 0x3a5abf;

    const partyPanel = this.add
      .rectangle(160, 42, 300, 72, panelColor, 0.92)
      .setDepth(2)
      .setStrokeStyle(1, borderColor, 0.9);
    this.registerBattleObject(partyPanel);

    const partyHeader = 'なまえ　   しょくぎょう   H    M';
    const partyStatus = PARTY_MEMBERS.map((member) => {
      const hp = member.hp.toString().padStart(3, ' ');
      const mp = member.mp.toString().padStart(3, ' ');
      return `${member.name.padEnd(6, '　')} ${member.job.padEnd(8, '　')} H${hp} M${mp}`;
    }).join('\n');

    const partyText = this.add
      .text(28, 16, `${partyHeader}\n${partyStatus}`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#e9edff',
        lineSpacing: 4
      })
      .setDepth(3);
    this.registerBattleObject(partyText);

    const commandsPanel = this.add
      .rectangle(24, 112, 140, 64, panelColor, 0.92)
      .setOrigin(0, 0)
      .setDepth(2)
      .setStrokeStyle(1, borderColor, 0.9);
    this.registerBattleObject(commandsPanel);

    const commandOptions = ['こうげき', 'どうぐ', 'じゅもん', 'ぼうぎょ', 'にげる'];
    commandOptions.forEach((option, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const commandText = this.add
        .text(36 + column * 70, 122 + row * 18, option, {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#f9f7ff'
        })
        .setDepth(3);
      this.registerBattleObject(commandText);
    });

    const enemyPanel = this.add
      .rectangle(176, 112, 120, 64, panelColor, 0.92)
      .setOrigin(0, 0)
      .setDepth(2)
      .setStrokeStyle(1, borderColor, 0.9);
    this.registerBattleObject(enemyPanel);

    this.enemyInfo = this.add
      .text(188, 122, `${enemy.name}\n外見: ${enemy.appearance}\n弱点: ${enemy.weakness}`, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#d6e4ff',
        wordWrap: { width: 100 }
      })
      .setDepth(3);
    this.registerBattleObject(this.enemyInfo);

    const messagePanel = this.add
      .rectangle(160, 162, 300, 44, panelColor, 0.92)
      .setDepth(2)
      .setStrokeStyle(1, borderColor, 0.9);
    this.registerBattleObject(messagePanel);

    const dialog = `${enemy.name} が あらわれた！\n${enemy.quote}`;
    this.enemyDialog = this.add
      .text(32, 146, dialog, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#f5f6ff',
        wordWrap: { width: 256 }
      })
      .setDepth(3);
    this.registerBattleObject(this.enemyDialog);
  }

  private registerBattleObject<T extends Phaser.GameObjects.GameObject>(object: T): T {
    this.battleObjects.push(object);
    return object;
  }

  private clearBattleObjects(): void {
    this.battleObjects.forEach((object) => object.destroy());
    this.battleObjects = [];
  }
}
