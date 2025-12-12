
import SlotReel from "./SlotReel";

const { ccclass, property } = cc._decorator;

/**
 * SlotReel使用示例
 * 展示如何在GameUI中使用SlotReel组件
 */
@ccclass('SlotReelExample')
export default class SlotReelExample extends cc.Component {
    @property({ type: [cc.Node], tooltip: "滚轮节点列表（每个节点挂载了SlotReel组件）" })
    public reelNodes: cc.Node[] = [];

    @property({ type: cc.Node, tooltip: "启动按钮" })
    public startBtn: cc.Node = null;

    private reelComponents: SlotReel[] = [];

    onLoad() {
        // 获取所有滚轮组件
        this.reelComponents = this.reelNodes.map(node => node.getComponent(SlotReel));
    }

    start() {
        // 绑定启动按钮事件
        if (this.startBtn) {
            this.startBtn.on(cc.Node.EventType.TOUCH_END, this.onStartBtnClick, this);
        }
    }

    /**
     * 启动按钮点击事件
     */
    private onStartBtnClick() {
        this.startSlotMachine();
    }

    /**
     * 启动老虎机
     * @param targetIds 每列的目标spriteId数组，如果不传则随机
     */
    public startSlotMachine(targetIds?: number[]) {
        // 如果未指定，随机生成
        if (!targetIds) {
            targetIds = [
                Math.floor(Math.random() * 5),
                Math.floor(Math.random() * 5),
                Math.floor(Math.random() * 5)
            ];
        }

        // 启动每个滚轮
        for (let i = 0; i < this.reelComponents.length; i++) {
            let reel = this.reelComponents[i];
            if (reel) {
                let targetId = targetIds[i] !== undefined ? targetIds[i] : Math.floor(Math.random() * 5);
                reel.startSpin(targetId, () => {
                    // 单个滚轮停止后的回调
                    this.onReelStopped(i);
                });
            }
        }
    }

    /**
     * 单个滚轮停止后的回调
     */
    private onReelStopped(reelIndex: number) {
        console.log(`滚轮 ${reelIndex} 停止，中心spriteId:`, this.reelComponents[reelIndex].getCenterSpriteId());

        // 检查是否所有滚轮都停止了
        let allStopped = true;
        for (let i = 0; i < this.reelComponents.length; i++) {
            if (this.reelComponents[i].getIsSpinning()) {
                allStopped = false;
                break;
            }
        }

        if (allStopped) {
            this.onAllReelsStopped();
        }
    }

    /**
     * 所有滚轮停止后的回调
     */
    private onAllReelsStopped() {
        console.log('所有滚轮停止！');
        let result = this.reelComponents.map(reel => reel.getCenterSpriteId());
        console.log('最终结果：', result);
        // 可以在这里添加停止后的逻辑，比如检查中奖等
    }

    /**
     * 停止所有滚轮（立即停止）
     */
    public stopAllReels() {
        for (let i = 0; i < this.reelComponents.length; i++) {
            let reel = this.reelComponents[i];
            if (reel) {
                reel.stopSpin();
            }
        }
    }
}

