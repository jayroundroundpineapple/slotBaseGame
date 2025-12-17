
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
    private slotColmunArr:cc.Node[] = [] //slot列数
    @property(cc.Prefab)
    private slotItemPre:cc.Prefab = null  //slot预制体
    @property(cc.Node)
    private maxBg:cc.Node = null
    @property(cc.Node)
    private maskNode:cc.Node = null
    @property(cc.Node)
    private startBtn:cc.Node = null  // 启动按钮

    stopColMunArr:boolean[] = [false,false,false]
    slotItemArr:cc.Node[][] = [];
    private bgmAudioFlag:boolean = true
    private canPlayMusic:boolean = false
    private gameModel: GameModel = null
    
    // 动画控制相关
    private isSpinning:boolean = false  // 是否正在旋转
    private columnAnimTweens:cc.Tween[] = []  // 每列的动画tween
    private columnSpeeds:number[] = [0.5, 0.5, 0.5]  // 每列的当前速度（duration）
    private targetSpriteIds:number[] = [-1, -1, -1]  // 每列的目标spriteId
    private columnStopCounts:number[] = [0, 0, 0]  // 每列需要移动的次数（用于减速）
    private minSpeed:number = 0.05  // 最快速度
    private maxSpeed:number = 0.5  // 最慢速度
    private speedChangeStep:number = 0.01  // 速度变化步长
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
        
        // 绑定启动按钮事件
        if(this.startBtn){
            this.startBtn.on(cc.Node.EventType.TOUCH_END, this.onStartBtnClick, this)
        }
    }
    /**初始化slot的位置 */
    private initGame(){
        let spriteIndexArr:number[][] = [[0,1,2,3,4],[0,1,2,3,4],[0,1,2,3,4]]
        for(let i = 0; i < this.slotColmunArr.length; i++){
            this.slotItemArr[i] = [];
            for(let j = 0; j < GameConf.SlotRowNum; j++){
                let slotItemNode = cc.instantiate(this.slotItemPre)
                slotItemNode.parent = this.slotColmunArr[i]
                let slotItemComp = slotItemNode.getComponent(slotItem)
                slotItemComp.initItem(spriteIndexArr[i][j])
                slotItemNode.setPosition(0, GameConf.SlotFirstY - j * GameConf.SlotItemHeight)
                this.slotItemArr[i].push(slotItemNode)
            }
        }
    }
    
    /**启动按钮点击事件 */
    private onStartBtnClick(){
        if(this.isSpinning){
            return  // 正在旋转中，不响应
        }
        this.canPlayMusic && cc.audioEngine.play(RESSpriteFrame.instance.clickAudioClip, false, 1)
        this.startSlotMachine()
    }
    
    /**启动老虎机
     * @param targetIds 每列的目标spriteId数组，如果不传则随机
     */
    public startSlotMachine(targetIds?:number[]){
        if(this.isSpinning){
            return
        }
        this.isSpinning = true
        
        // 设置目标spriteId（如果未指定则随机）
        if(!targetIds){
            targetIds = [
                1,
                2,
                3
            ]
        }
        this.targetSpriteIds = targetIds
        // 重置状态
        this.stopColMunArr = [false, false, false]
        this.columnSpeeds = [this.maxSpeed, this.maxSpeed, this.maxSpeed]
        this.columnStopCounts = [0, 0, 0]
        // 停止所有现有动画
        this.stopAllAnimations()
        // 启动每列的动画
        for(let i = 0; i < this.slotColmunArr.length; i++){
            this.startColumnAnimation(i)
        }
    }
    
    /**启动指定列的动画 */
    private startColumnAnimation(column:number){
        // 计算需要移动的次数（加速阶段 + 匀速阶段 + 减速阶段）
        let speedUpSteps = 8  // 加速阶段步数
        let constantSteps = 12 + this.getRandomInt(5, 15)  // 匀速阶段步数（随机增加变化）
        let slowDownSteps = 8  // 减速阶段步数
        // 计算需要额外移动的步数，确保停止时显示区域中心的item有正确的spriteIndex
        let extraSteps = this.calculateExtraSteps(column, this.targetSpriteIds[column])
        let totalSteps = speedUpSteps + constantSteps + slowDownSteps + extraSteps
        this.columnStopCounts[column] = totalSteps
        // 开始动画
        this.doSlotAnimWithSpeed(column, 0, totalSteps, speedUpSteps, slowDownSteps)
    }
    
    /**计算需要额外移动的步数，使显示区域中心的item有指定的spriteIndex */
    private calculateExtraSteps(column:number, targetSpriteId:number):number{
        // 显示区域中心Y坐标（根据配置，显示3行，中心在0）
        let displayCenterY = 0
        // 找到当前最接近显示区域中心的item
        let centerItem = this.getItemAtY(column, displayCenterY)
        if(!centerItem){
            return 0
        }
        // 找到目标spriteIndex的item
        let targetItem = null
        for(let i = 0; i < this.slotItemArr[column].length; i++){
            let item = this.slotItemArr[column][i]
            let comp = item.getComponent(slotItem)
            if(comp && comp.spriteIndex === targetSpriteId){
                targetItem = item
                break
            }
        }
        if(!targetItem){
            return 0
        }
        // 计算需要移动的距离（向上移动，y值减小）
        let centerY = centerItem.y
        let targetY = targetItem.y
        // 如果targetItem在currentItem下方，需要多转一圈
        if(targetY > centerY){
             // targetItem在上方，直接计算步数
             let steps = Math.ceil(( targetY - centerY) / GameConf.SlotItemHeight)
            return steps
        } else {
            if(targetY == centerY)return 0
           // targetItem在下方，需要移动 (5个item的高度) + (currentY - targetY)
           let steps = Math.ceil((GameConf.SlotItemHeight * GameConf.SlotRowNum + (centerY - targetY)) / GameConf.SlotItemHeight)
            return steps
        }
    }
    
    /**获取指定Y坐标位置的item */
    private getItemAtY(column:number, y:number):cc.Node{
        let minDist = Infinity
        let closestItem = null
        for(let i = 0; i < this.slotItemArr[column].length; i++){
            let item = this.slotItemArr[column][i]
            let dist = Math.abs(item.y - y)
            if(dist < minDist){
                minDist = dist
                closestItem = item
            }
        }
        return closestItem
    }
    
    /**带速度变化的slot动画 */
    private doSlotAnimWithSpeed(column:number, currentStep:number, totalSteps:number, speedUpSteps:number, slowDownSteps:number){
        if(this.stopColMunArr[column]){
            return
        }
        
        // 计算当前速度
        let speed = this.maxSpeed
        if(currentStep < speedUpSteps){
            // 加速阶段：从慢到快
            let progress = currentStep / speedUpSteps
            speed = this.maxSpeed - (this.maxSpeed - this.minSpeed) * progress
        } else if(currentStep >= totalSteps - slowDownSteps){
            // 减速阶段：从快到慢
            let progress = (currentStep - (totalSteps - slowDownSteps)) / slowDownSteps
            speed = this.minSpeed + (this.maxSpeed - this.minSpeed) * progress
        } else {
            // 匀速阶段
            speed = this.minSpeed
        }
        
        this.columnSpeeds[column] = speed
        
        // 同步移动该列的所有item
        let completedCount = 0
        let itemCount = this.slotItemArr[column].length
        
        for(let j = 0; j < itemCount; j++){
            let node = this.slotItemArr[column][j]
            cc.tween(node)
                .by(speed, { y: -GameConf.SlotItemHeight })
                .call(() => {
                    if(node.y <= GameConf.SlotLastY){
                        // 回到第一个位置，并更新spriteIndex（循环）
                        // 确保位置精确对齐到网格
                        node.setPosition(0, GameConf.SlotFirstY)
                        this.updateItemSpriteIndex(node, column)
                    }
                    
                    // 所有item移动完成后，继续下一步
                    completedCount++
                    if(completedCount >= itemCount){
                        let nextStep = currentStep + 1
                        if(nextStep >= totalSteps){
                            // 停止该列
                            this.stopColumn(column)
                        } else {
                            this.doSlotAnimWithSpeed(column, nextStep, totalSteps, speedUpSteps, slowDownSteps)
                        }
                    }
                })
                .start()
        }
    }
    
    /**更新item的spriteIndex（循环） */
    private updateItemSpriteIndex(node:cc.Node, column:number){
        let comp = node.getComponent(slotItem)
        if(comp){
            let currentIdx = comp.spriteIndex
            let nextIdx = (currentIdx + 1) % 5  // 假设有5种sprite（0-4）
            comp.initItem(nextIdx)
        }
    }
    
    /**停止指定列 */
    private stopColumn(column:number){
        this.stopColMunArr[column] = true
        
        // 停止该列的所有动画
        for(let j = 0; j < this.slotItemArr[column].length; j++){
            cc.Tween.stopAllByTarget(this.slotItemArr[column][j])
        }
        
        // 精确调整位置，确保显示区域的item有正确的spriteIndex
        this.adjustColumnPosition(column, this.targetSpriteIds[column])
        
        // 检查是否所有列都停止了
        let allStopped = true
        for(let i = 0; i < this.stopColMunArr.length; i++){
            if(!this.stopColMunArr[i]){
                allStopped = false
                break
            }
        }
        
        if(allStopped){
            this.isSpinning = false
            // 可以在这里添加停止后的回调
            this.onSlotMachineStopped()
        }
    }
    
    /**精确调整列的位置 */
    private adjustColumnPosition(column:number, targetSpriteId:number){
        // 显示区域中心Y坐标
        let displayCenterY = 0
        
        // 找到目标spriteIndex的item
        let targetItem = null
        for(let i = 0; i < this.slotItemArr[column].length; i++){
            let item = this.slotItemArr[column][i]
            let itemComp = item.getComponent(slotItem)
            if(itemComp && itemComp.spriteIndex === targetSpriteId){
                targetItem = item
                break
            }
        }
        
        if(!targetItem){
            return
        }
        
        // 计算需要调整的偏移量，使目标item移动到显示区域中心
        let offset = targetItem.y - displayCenterY
        
        // 调整该列所有item的位置
        for(let i = 0; i < this.slotItemArr[column].length; i++){
            let item = this.slotItemArr[column][i]
            item.y -= offset
        }
        
        // 对齐所有item到正确的网格位置（300, 150, 0, -150, -300）
        this.alignItemsToGrid(column)
    }
    
    /**将所有item对齐到网格位置 */
    private alignItemsToGrid(column:number){
        // 标准网格位置：300, 150, 0, -150, -300
        // 根据item的当前y坐标，找到最接近的标准位置
        
        // 先按y坐标排序item（从大到小），并记录原始索引
        let itemsWithIndex = this.slotItemArr[column].map((item, index) => ({
            item: item,
            index: index,
            y: item.y
        }))
        itemsWithIndex.sort((a, b) => b.y - a.y)
        // 标准位置数组（从大到小）：300, 150, 0, -150, -300
        let standardPositions = []
        for(let i = 0; i < GameConf.SlotRowNum; i++){
            standardPositions.push(GameConf.SlotFirstY - i * GameConf.SlotItemHeight)
        }
        
        // 将每个item对齐到对应的标准位置
        for(let i = 0; i < itemsWithIndex.length && i < standardPositions.length; i++){
            itemsWithIndex[i].item.y = standardPositions[i]
        }
    }
    
    /**停止所有动画 */
    private stopAllAnimations(){
        for(let i = 0; i < this.slotItemArr.length; i++){
            for(let j = 0; j < this.slotItemArr[i].length; j++){
                cc.Tween.stopAllByTarget(this.slotItemArr[i][j])
            }
        }
    }
    
    /**老虎机停止后的回调 */
    private onSlotMachineStopped(){
        console.log('老虎机停止，结果：', this.targetSpriteIds)
        // 可以在这里添加停止后的逻辑，比如检查中奖等
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
