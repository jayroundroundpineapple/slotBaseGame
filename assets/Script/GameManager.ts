import BoxItem from "./BoxItem";
import { BoxType, GameConf } from "./GameConf";
import GameUI from "./GameUI";
import zidanItem from "./zidanItem";

/**
 * 游戏逻辑管理器
 * 负责游戏的核心逻辑，包括初始化、攻击、发射等
 */
export interface MapBoxItem {
    BoxItem: BoxItem;
    isFree: boolean;
    colMun: number;
    rowNum: number;
}

export class GameManager {
    private static _instance: GameManager = null;
    public static get instance(): GameManager {
        if (!this._instance) {
            this._instance = new GameManager();
        }
        return this._instance;
    }

    private gameUI: GameUI = null;
    private boxDataList: MapBoxItem[] = [];
    private isGameInitialized: boolean = false;

    /**
     * 初始化游戏管理器
     */
    public init(gameUI: GameUI) {
        this.gameUI = gameUI;
        this.isGameInitialized = false;
        this.boxDataList = [];
    }

    /**
     * 初始化游戏
     */
    public initGame() {
        if (this.isGameInitialized) {
            console.warn('游戏已经初始化过了');
            return;
        }

        if (!this.gameUI) {
            console.error('GameUI未设置');
            return;
        }

        let gameData = GameConf.GameDataArr;
        let rowNum = -1;
        let colMun = -1;

        // 创建所有Box
        for (let i = 0; i < GameConf.BoxColMunNum; i++) {
            for (let j = 0; j < GameConf.BoxRowNum; j++) {
                rowNum = j;
                colMun = i;
                
                // 创建Box节点
                let boxItemNode = cc.instantiate(this.gameUI.boxItemPrefab);
                let boxItem = boxItemNode.getComponent(BoxItem);
                boxItemNode.parent = this.gameUI.boxbornNode;
                
                // 初始化Box
                boxItem.initBoxItem(
                    j * GameConf.BoxColMunNum + i,
                    gameData[j][i],
                    i,
                    j
                );
                
                // 设置位置
                boxItemNode.setPosition(
                    GameConf.BoxFirstX + i * GameConf.BoxColumnGap,
                    GameConf.BoxFirstY + j * GameConf.BoxRowGap
                );
                
                // 添加到数据列表
                this.boxDataList.push({
                    BoxItem: boxItem,
                    isFree: false,
                    colMun: colMun,
                    rowNum: rowNum
                });
            }
        }

        this.isGameInitialized = true;
        console.log(`游戏初始化完成，共创建 ${this.boxDataList.length} 个Box`);
    }

    /**
     * 开始攻击
     */
    public startAttack() {
       
        let attackArr:MapBoxItem[] = []
        for(let i = 0; i < GameConf.BoxColMunNum; i++) {
            attackArr.push(this.boxDataList[i*GameConf.BoxColMunNum])
        }
        // 移动到炮塔位置
        cc.tween(this.gameUI.targetAttackNode)
            .delay(0.1)
            .to(0.3, { position: this.gameUI.targetZiArr[0].position })
            .call(() => {
                this.shoot(attackArr);
            })
            .start();
    }

    /**
     * 发射炮弹（支持多个目标，按顺序射击）
     * @param mapBoxItems 目标Box数据数组
     */
    public shoot(mapBoxItems: MapBoxItem[]) {
        if (!mapBoxItems || mapBoxItems.length === 0) {
            console.warn('目标Box数组为空');
            return;
        }
        // 过滤掉无效的目标
        let validTargets = mapBoxItems.filter(item => item && item.BoxItem && !item.isFree);
        if (validTargets.length === 0) {
            console.warn('没有有效的目标Box');
            return;
        }
        // 按顺序射击
        this.shootSequence(validTargets, 0);
    }

    /**
     * 按顺序射击目标队列
     * @param targets 目标数组
     * @param index 当前射击的索引
     */
    private shootSequence(targets: MapBoxItem[], index: number) {
        if (index >= targets.length) {
            console.log(`所有目标射击完成，共射击 ${targets.length} 个目标`);
            return;
        }

        let mapBoxItem = targets[index];
        if (!mapBoxItem || !mapBoxItem.BoxItem || mapBoxItem.isFree) {
            // 如果当前目标无效，跳过并射击下一个
            console.log(`跳过无效目标 [${index}]`);
            this.shootSequence(targets, index + 1);
            return;
        }
        let lbNode = this.gameUI.targetAttackNode.children[0];
        let booldNum = lbNode.getComponent(cc.Label).string;
        lbNode.getComponent(cc.Label).string = (Number(booldNum) - 1).toString();
        this.shootSingle(mapBoxItem, () => {
            this.shootSequence(targets, index + 1);
        });
    }

    /**
     * 射击单个目标
     * @param mapBoxItem 目标Box数据
     * @param onComplete 射击完成回调
     */
    private shootSingle(mapBoxItem: MapBoxItem, onComplete?: () => void) {
        if (!mapBoxItem || !mapBoxItem.BoxItem) {
            console.warn('目标Box无效');
            onComplete && onComplete();
            return;
        }
        let zidanNode = cc.instantiate(this.gameUI.zidanPrefab);
        let zidanComponent = zidanNode.getComponent(zidanItem);
        zidanNode.parent = this.gameUI.targetAttackNode;
        zidanNode.setPosition(0, 0);

        let targetNode = mapBoxItem.BoxItem.node;
        let worldPos = targetNode.parent.convertToWorldSpaceAR(targetNode.position);
        let localPos = zidanNode.parent.convertToNodeSpaceAR(worldPos);

        // 子弹移动动画
        cc.tween(zidanNode)
            .to(0.1, { position: localPos }, { easing: 'quadIn' })
            .call(() => {
                // 击中目标
                this.onHitTarget(mapBoxItem, targetNode, zidanNode, zidanComponent);
                onComplete && onComplete();
            })
            .start();
    }

    /**
     * 击中目标处理
     */
    private onHitTarget(
        mapBoxItem: MapBoxItem,
        targetNode: cc.Node,
        zidanNode: cc.Node,
        zidanComponent: zidanItem,
        onComplete?: () => void
    ) {
        // 目标消失动画
        cc.tween(targetNode)
            .to(0.05, { scale: 0 })
            .call(() => {
                // 清理Box数据
                this.removeBox(mapBoxItem);
            })
            .start();
        if (zidanComponent.animNode) {
            zidanComponent.animNode.active = true;
        }
        // 隐藏子弹节点
        zidanComponent.hideZidan();
        zidanComponent.playboomAnim(() => {
            // 爆炸动画完成后，销毁整个子弹节点
            zidanNode.destroy();
            // 调用完成回调，继续射击下一个目标
            // onComplete && onComplete();
        });
    }

    /**
     * 移除Box
     */
    private removeBox(mapBoxItem: MapBoxItem) {
        if (mapBoxItem.BoxItem && mapBoxItem.BoxItem.node) {
            mapBoxItem.BoxItem.node.destroy();
        }
        
        mapBoxItem.isFree = true;
        mapBoxItem.BoxItem = null;
        mapBoxItem.colMun = -1;
        mapBoxItem.rowNum = -1;
    }

    /**
     * 获取Box数据列表
     */
    public getBoxDataList(): MapBoxItem[] {
        return this.boxDataList;
    }

    /**
     * 根据行列获取Box
     */
    public getBoxByPosition(colMun: number, rowNum: number): MapBoxItem | null {
        for (let item of this.boxDataList) {
            if (item.colMun === colMun && item.rowNum === rowNum && !item.isFree) {
                return item;
            }
        }
        return null;
    }

    /**
     * 获取空闲的Box位置
     */
    public getFreeBoxPositions(): { colMun: number; rowNum: number }[] {
        let freePositions: { colMun: number; rowNum: number }[] = [];
        for (let item of this.boxDataList) {
            if (item.isFree) {
                freePositions.push({ colMun: item.colMun, rowNum: item.rowNum });
            }
        }
        return freePositions;
    }

    /**
     * 重置游戏
     */
    public resetGame() {
        // 清理所有Box
        for (let item of this.boxDataList) {
            if (item.BoxItem && item.BoxItem.node) {
                item.BoxItem.node.destroy();
            }
        }
        this.boxDataList = [];
        this.isGameInitialized = false;
    }

    /**
     * 销毁
     */
    public destroy() {
        this.resetGame();
        this.gameUI = null;
        GameManager._instance = null;
    }
}

