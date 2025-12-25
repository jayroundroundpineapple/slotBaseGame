
import BoxItem from "./BoxItem";
import { GameConf } from "./GameConf";
import { GameModel } from "./GameModel";
import RESSpriteFrame from "./RESSpriteFrame";
import slotItem from "./slotItem";


const { ccclass, property } = cc._decorator; 

@ccclass
export default class GameUI extends cc.Component {
    @property(cc.Prefab)
    private boxItemPrefab:cc.Prefab = null
    @property(cc.Node)
    private boxbornNode:cc.Node = null;
    @property(cc.Node)
    private bgNode:cc.Node = null
    @property(cc.Node)
    private maxBg:cc.Node = null
    @property(cc.Node)
    private maskNode:cc.Node = null
    

    boxData:BoxItem[] = [];
    private bgmAudioFlag:boolean = true
    private canPlayMusic:boolean = false
    private gameModel: GameModel = null
    
   
    protected onLoad(): void {
        this.gameModel = new GameModel()
        this.gameModel.mGame = this
    }
    protected start(): void {
        PlayerAdSdk.init();
        this.resize()
        let that = this;
        /**屏幕旋转尺寸改变 */
        cc.view.setResizeCallback(() => {
            that.resize();
        })
        cc.find('Canvas').on('touchstart',()=>{
            this.canPlayMusic = true
            this.bgmAudioFlag && cc.audioEngine.play(RESSpriteFrame.instance.bgmAudioClip,false,1)   
            this.bgmAudioFlag = false
        })
        this.resize()
        this.initGame()
       
    }
    private initGame(){
        for(let i = 0; i < GameConf.BoxColMunNum; i++){
            for(let j = 0; j < GameConf.BoxRowNum; j++){
                let boxItemNode = cc.instantiate(this.boxItemPrefab)
                let boxItem = boxItemNode.getComponent(BoxItem)
                boxItemNode.parent = this.boxbornNode;
                boxItem.getComponent(BoxItem).initBoxItem(j*GameConf.BoxColMunNum+i,this.getRandomInt(0,1),i,j)
                boxItemNode.setPosition(GameConf.BoxFirstX + i * GameConf.BoxColumnGap, GameConf.BoxFirstY + j * GameConf.BoxRowGap)
                this.boxData.push(boxItem)
            }
        }
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
    protected onDisable(): void {
        
    }
}   
