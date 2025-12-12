
import { GameConf } from "./GameConf";
import slotItem from "./slotItem";

const { ccclass, property } = cc._decorator;

/**
 * Slot滚轮组件
 * 可以直接挂载在slot节点上使用
 * 支持变速动画、指定停止位置等功能
 */
@ccclass('SlotReel')
export default class SlotReel extends cc.Component {
    @property({ type: cc.Prefab, tooltip: "slot item预制体" })
    public slotItemPrefab: cc.Prefab = null;

    @property({ tooltip: "单个item的高度" })
    public itemHeight: number = 150;

    @property({ tooltip: "第一个item的Y坐标" })
    public firstY: number = 300;

    @property({ tooltip: "最后一个item的Y坐标（用于循环判断）" })
    public lastY: number = -450;

    @property({ tooltip: "显示区域中心Y坐标" })
    public displayCenterY: number = 0;

    @property({ tooltip: "item数量（行数）" })
    public itemCount: number = 5;

    @property({ tooltip: "最慢速度（duration，秒）" })
    public maxSpeed: number = 0.5;

    @property({ tooltip: "最快速度（duration，秒）" })
    public minSpeed: number = 0.05;

    @property({ tooltip: "加速阶段步数" })
    public speedUpSteps: number = 8;

    @property({ tooltip: "匀速阶段最小步数" })
    public constantMinSteps: number = 12;

    @property({ tooltip: "匀速阶段最大步数" })
    public constantMaxSteps: number = 27;

    @property({ tooltip: "减速阶段步数" })
    public slowDownSteps: number = 8;

    // 内部状态
    private slotItemArr: cc.Node[] = [];
    private isSpinning: boolean = false;
    private isStopped: boolean = false;
    private currentStep: number = 0;
    private totalSteps: number = 0;
    private targetSpriteId: number = -1;
    private stopCallback: Function = null;

    onLoad() {
        this.initReel();
    }

    /**
     * 初始化滚轮
     */
    private initReel() {
        // 清空现有item
        this.slotItemArr = [];
        this.node.removeAllChildren();

        // 创建初始item
        let spriteIndexArr = [0, 1, 2, 3, 4];
        for (let j = 0; j < this.itemCount; j++) {
            let slotItemNode = cc.instantiate(this.slotItemPrefab);
            slotItemNode.parent = this.node;
            let slotItemComp = slotItemNode.getComponent(slotItem);
            if (slotItemComp) {
                slotItemComp.initItem(spriteIndexArr[j]);
            }
            slotItemNode.setPosition(0, this.firstY - j * this.itemHeight);
            this.slotItemArr.push(slotItemNode);
        }
    }

    /**
     * 启动滚轮
     * @param targetSpriteId 目标停止的spriteId，如果不传则随机
     * @param callback 停止后的回调函数
     */
    public startSpin(targetSpriteId?: number, callback?: Function) {
        if (this.isSpinning) {
            return;
        }

        this.isSpinning = true;
        this.isStopped = false;
        this.currentStep = 0;

        // 设置目标spriteId
        if (targetSpriteId === undefined || targetSpriteId === null) {
            this.targetSpriteId = Math.floor(Math.random() * 5);
        } else {
            this.targetSpriteId = targetSpriteId;
        }

        this.stopCallback = callback;

        // 停止所有现有动画
        this.stopAllAnimations();

        // 计算总步数
        let constantSteps = this.constantMinSteps + Math.floor(Math.random() * (this.constantMaxSteps - this.constantMinSteps + 1));
        let extraSteps = this.calculateExtraSteps(this.targetSpriteId);
        this.totalSteps = this.speedUpSteps + constantSteps + this.slowDownSteps + extraSteps;

        // 开始动画
        this.doSlotAnimWithSpeed();
    }

    /**
     * 停止滚轮（立即停止）
     */
    public stopSpin() {
        if (!this.isSpinning) {
            return;
        }

        this.isSpinning = false;
        this.isStopped = true;

        // 停止所有动画
        this.stopAllAnimations();

        // 调整位置
        this.adjustPosition(this.targetSpriteId);

        // 执行回调
        if (this.stopCallback) {
            this.stopCallback();
            this.stopCallback = null;
        }
    }

    /**
     * 计算需要额外移动的步数
     */
    private calculateExtraSteps(targetSpriteId: number): number {
        let centerItem = this.getItemAtY(this.displayCenterY);
        if (!centerItem) {
            return 0;
        }

        // 找到目标spriteIndex的item
        let targetItem = null;
        for (let i = 0; i < this.slotItemArr.length; i++) {
            let item = this.slotItemArr[i];
            let comp = item.getComponent(slotItem);
            if (comp && comp.spriteIndex === targetSpriteId) {
                targetItem = item;
                break;
            }
        }

        if (!targetItem) {
            return 0;
        }

        // 计算需要移动的距离
        let centerY = centerItem.y;
        let targetY = targetItem.y;

        if (targetY > centerY) {
            // targetItem在上方，直接计算步数
            return Math.ceil((targetY - centerY) / this.itemHeight);
        } else if (targetY < centerY) {
            // targetItem在下方，需要移动一圈
            return Math.ceil((this.itemHeight * this.itemCount + (centerY - targetY)) / this.itemHeight);
        } else {
            return 0;
        }
    }

    /**
     * 获取指定Y坐标位置的item
     */
    private getItemAtY(y: number): cc.Node {
        let minDist = Infinity;
        let closestItem = null;
        for (let i = 0; i < this.slotItemArr.length; i++) {
            let item = this.slotItemArr[i];
            let dist = Math.abs(item.y - y);
            if (dist < minDist) {
                minDist = dist;
                closestItem = item;
            }
        }
        return closestItem;
    }

    /**
     * 带速度变化的slot动画
     */
    private doSlotAnimWithSpeed() {
        if (this.isStopped) {
            return;
        }

        // 计算当前速度
        let speed = this.maxSpeed;
        if (this.currentStep < this.speedUpSteps) {
            // 加速阶段：从慢到快
            let progress = this.currentStep / this.speedUpSteps;
            speed = this.maxSpeed - (this.maxSpeed - this.minSpeed) * progress;
        } else if (this.currentStep >= this.totalSteps - this.slowDownSteps) {
            // 减速阶段：从快到慢
            let progress = (this.currentStep - (this.totalSteps - this.slowDownSteps)) / this.slowDownSteps;
            speed = this.minSpeed + (this.maxSpeed - this.minSpeed) * progress;
        } else {
            // 匀速阶段
            speed = this.minSpeed;
        }

        // 同步移动所有item
        let completedCount = 0;
        let itemCount = this.slotItemArr.length;

        for (let j = 0; j < itemCount; j++) {
            let node = this.slotItemArr[j];
            cc.tween(node)
                .by(speed, { y: -this.itemHeight })
                .call(() => {
                    if (node.y <= this.lastY) {
                        // 回到第一个位置，并更新spriteIndex（循环）
                        node.setPosition(0, this.firstY);
                        this.updateItemSpriteIndex(node);
                    }
                    // 所有item移动完成后，继续下一步
                    completedCount++;
                    if (completedCount >= itemCount) {
                        this.currentStep++;
                        if (this.currentStep >= this.totalSteps) {
                            // 停止
                            this.stopSpin();
                        } else {
                            this.doSlotAnimWithSpeed();
                        }
                    }
                })
                .start();
        }
    }

    /**
     * 更新item的spriteIndex（循环）
     */
    private updateItemSpriteIndex(node: cc.Node) {
        let comp = node.getComponent(slotItem);
        if (comp) {
            let currentIdx = comp.spriteIndex;
            let nextIdx = (currentIdx + 1) % 5; // 假设有5种sprite（0-4）
            comp.initItem(nextIdx);
        }
    }

    /**
     * 精确调整位置
     */
    private adjustPosition(targetSpriteId: number) {
        // 找到目标spriteIndex的item
        let targetItem = null;
        for (let i = 0; i < this.slotItemArr.length; i++) {
            let item = this.slotItemArr[i];
            let itemComp = item.getComponent(slotItem);
            if (itemComp && itemComp.spriteIndex === targetSpriteId) {
                targetItem = item;
                break;
            }
        }
        if (!targetItem) {
            return;
        }
        // 计算需要调整的偏移量，使目标item移动到显示区域中心
        let offset = targetItem.y - this.displayCenterY;
        // 调整所有item的位置
        for (let i = 0; i < this.slotItemArr.length; i++) {
            let item = this.slotItemArr[i];
            item.y -= offset;
        }
        // 对齐所有item到正确的网格位置
        this.alignItemsToGrid();
    }

    /**
     * 将所有item对齐到网格位置
     */
    private alignItemsToGrid() {
        // 先按y坐标排序item（从大到小）
        let itemsWithY = this.slotItemArr.map((item) => ({
            item: item,
            y: item.y
        }));
        itemsWithY.sort((a, b) => b.y - a.y);

        // 标准位置数组（从大到小）
        let standardPositions = [];
        for (let i = 0; i < this.itemCount; i++) {
            standardPositions.push(this.firstY - i * this.itemHeight);
        }

        // 将每个item对齐到对应的标准位置
        for (let i = 0; i < itemsWithY.length && i < standardPositions.length; i++) {
            itemsWithY[i].item.y = standardPositions[i];
        }
    }

    /**
     * 停止所有动画
     */
    private stopAllAnimations() {
        for (let j = 0; j < this.slotItemArr.length; j++) {
            cc.Tween.stopAllByTarget(this.slotItemArr[j]);
        }
    }

    /**
     * 获取当前显示区域中心的spriteId
     */
    public getCenterSpriteId(): number {
        let centerItem = this.getItemAtY(this.displayCenterY);
        if (centerItem) {
            let comp = centerItem.getComponent(slotItem);
            if (comp) {
                return comp.spriteIndex;
            }
        }
        return -1;
    }

    /**
     * 是否正在旋转
     */
    public getIsSpinning(): boolean {
        return this.isSpinning;
    }
}

