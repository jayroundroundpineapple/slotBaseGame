
import { GameConf } from "./GameConf";
import { GameModel } from "./GameModel";
import RESSpriteFrame from "./RESSpriteFrame";
import slotItem from "./slotItem";


const { ccclass, property } = cc._decorator; 

@ccclass
export default class GameUI extends cc.Component {
    @property(cc.Node)
    private bgNode:cc.Node = null
    @property(cc.Node)
    private slotBox:cc.Node = null
    @property(cc.Node)
    private slotColmunArr:cc.Node[] = [] //slot列数
    @property(cc.Prefab)
    private slotItemPre:cc.Prefab = null  //slot预制体
    @property(cc.Node)
    private maxBg:cc.Node = null
    @property(cc.Node)
    private maskNode:cc.Node = null

    stopColMunArr:boolean[] = [false,false,false]
    slotItemArr:cc.Node[][] = [];
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
        this.scheduleOnce(()=>{
            this.stopColMunArr[0] = true
            this.stopColMunArr[1] = true
        },3.5)
    }
    /**初始化slot的位置 */
    private initGame(){
        let spriteIndexArr:number[][] = [[0,1,2,3,4],[0,1,2,3,4],[0,1,2,3,4]]
        for(let i = 0; i < this.slotColmunArr.length; i++){
            this.slotItemArr[i] = [];
            for(let j = 0; j < GameConf.SlotRowNum; j++){
                let slotItemNode = cc.instantiate(this.slotItemPre)
                slotItemNode.parent = this.slotColmunArr[i]
                slotItemNode.getComponent(slotItem).initItem(spriteIndexArr[i][j])
                slotItemNode.setPosition(0, GameConf.SlotFirstY - j * GameConf.SlotItemHeight)
                this.slotItemArr[i].push(slotItemNode)
            }
        }
        this.setAnim()
    }
    setAnim(){
        for(let i = 0; i < this.slotItemArr.length; i++){
            for(let j = 0; j < GameConf.SlotRowNum; j++){
                this.doSlotAnim(this.slotItemArr[i][j],i)
            }
        }
    }
    //slot的五个y坐标是【300，150，0，-150，-300】，slot显示区域在150到-150之间，然后到slot的y坐标小于或等于-300的时候，回到第一个位置
    doSlotAnim(node:cc.Node,column:number){
        cc.tween(node)
            .by(0.5, { y:-GameConf.SlotItemHeight })
            .call(()=>{
                if(node.y <= GameConf.SlotLastY){
                    //回到第一个位置
                    node.setPosition(0, GameConf.SlotFirstY)
                }
                if(this.stopColMunArr[column]){
                    //停止动画
                    return
                }
                this.doSlotAnim(node,column)       
            })
            .start()
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
