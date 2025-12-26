
import { GameManager } from "./GameManager";
import { GameModel } from "./GameModel";
import RESSpriteFrame from "./RESSpriteFrame";


const { ccclass, property } = cc._decorator;

/**
 * 游戏UI管理器
 * 负责UI显示和用户交互，逻辑部分由GameManager处理
 */
@ccclass
export default class GameUI extends cc.Component {
    @property(cc.Prefab)
    public zidanPrefab: cc.Prefab = null;
    
    @property(cc.Node)
    public targetAttackNode: cc.Node = null;
    
    @property(cc.Node)
    public targetZiArr: cc.Node[] = [];
    
    @property(cc.Prefab)
    public boxItemPrefab: cc.Prefab = null;
    
    @property(cc.Node)
    public boxbornNode: cc.Node = null;
    
    @property(cc.Node)
    private bgNode: cc.Node = null;
    
    @property(cc.Node)
    private maxBg: cc.Node = null;
    
    @property(cc.Node)
    private maskNode: cc.Node = null;

    private bgmAudioFlag: boolean = true;
    private canPlayMusic: boolean = false;
    private gameModel: GameModel = null;
    private gameManager: GameManager = null;


    protected onLoad(): void {
        this.gameModel = new GameModel();
        this.gameModel.mGame = this;
        
        // 初始化游戏管理器
        this.gameManager = GameManager.instance;
        this.gameManager.init(this);
    }

    protected start(): void {
        PlayerAdSdk.init();
        this.resize();
        let that = this;
        
        /**屏幕旋转尺寸改变 */
        cc.view.setResizeCallback(() => {
            that.resize();
        });
        
        cc.find('Canvas').on('touchstart', () => {
            this.canPlayMusic = true;
            this.bgmAudioFlag && cc.audioEngine.play(RESSpriteFrame.instance.bgmAudioClip, false, 1);
            this.bgmAudioFlag = false;
        });
        
        this.resize();
        this.initGame();
    }

    /**
     * 初始化游戏（UI层）
     */
    private initGame() {
        // 通过GameManager初始化游戏逻辑
        this.gameManager.initGame();
        
        if (this.targetAttackNode) {
            this.targetAttackNode.on(cc.Node.EventType.TOUCH_START, this.onTargetAttack, this);
        }
    }

    /**
     * 攻击目标（UI事件处理）
     */
    private onTargetAttack() {
        if (this.targetAttackNode) {
            this.targetAttackNode.off(cc.Node.EventType.TOUCH_START, this.onTargetAttack, this);
        }
        // 调用GameManager处理攻击逻辑
        this.gameManager.startAttack();
    }
    private getRandomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    private resize() {
        const canvasValue: any = cc.Canvas.instance;
        let frameSize = cc.view.getFrameSize();
        let isVerTical = cc.winSize.height > cc.winSize.width
        if (isVerTical) {//竖屏
            if (cc.winSize.width / cc.winSize.height > 0.7) {
                cc.Canvas.instance.fitHeight = true;
                cc.Canvas.instance.fitWidth = false;
            } else {
                cc.Canvas.instance.fitHeight = false;
                cc.Canvas.instance.fitWidth = true;
            }
        } else {
            cc.Canvas.instance.fitHeight = true;
            cc.Canvas.instance.fitWidth = false;
        }
        cc.director.getScene().getComponentsInChildren(cc.Widget).forEach(function (t) {
            t.updateAlignment()
        });
        this.maxBg.active = !isVerTical
    }
    private cashoutFunc() {
        console.log('跳转');
        this.canPlayMusic && cc.audioEngine.play(RESSpriteFrame.instance.clickAudioClip, false, 1)
        PlayerAdSdk.gameEnd()
        PlayerAdSdk.jumpStore()
    }
    /**
     * 获取GameManager实例（供外部访问）
     */
    public getGameManager(): GameManager {
        return this.gameManager;
    }

    protected onDisable(): void {
        // 清理事件
        if (this.targetAttackNode) {
            this.targetAttackNode.off(cc.Node.EventType.TOUCH_START, this.onTargetAttack, this);
        }
    }

    protected onDestroy(): void {
        // 清理GameManager
        if (this.gameManager) {
            this.gameManager.destroy();
        }
    }
}   
