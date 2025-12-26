const { ccclass, property } = cc._decorator;

@ccclass
export default class zidanItem extends cc.Component {

    @property(cc.Node)
    public animNode: cc.Node = null
    @property(cc.Node)
    private zidanNode: cc.Node = null

    initItem() {
        this.animNode.active = false
    }
    public destroyZidan() {
        this.zidanNode.destroy()
    }
    
    /**
     * 隐藏子弹节点（不销毁，用于播放爆炸动画）
     */
    public hideZidan() {
        if (this.zidanNode) {
            this.zidanNode.active = false;
        }
    }
    
    private isAnimFinished: boolean = false;
    private animCallback: Function = null;

    public playboomAnim(cb:Function = null) {
        this.isAnimFinished = false;
        this.animCallback = cb;
        this.animNode.active = true;
        let animation = this.animNode.getComponent(cc.Animation);
        animation.off('finished');
        // 监听动画完成事件（使用多种方式确保能触发）
        let finishedHandler = () => {
            if (!this.isAnimFinished) {
                this.isAnimFinished = true;
                console.log('爆炸动画完成 - finished事件触发');
                animation.off('finished', finishedHandler, this);
                if (this.animCallback) {
                    this.animCallback();
                    this.animCallback = null;
                }
            }
        };
        
        animation.on('finished', finishedHandler, this);
        let animState = animation.play('clear1');
    }

}
