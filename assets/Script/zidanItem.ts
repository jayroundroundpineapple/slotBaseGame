const { ccclass, property } = cc._decorator;

@ccclass
export default class zidanItem extends cc.Component {

    @property(cc.Node)
    private animNode: cc.Node = null
    @property(cc.Node)
    private zidanNode: cc.Node = null

    initItem() {
        this.animNode.active = false
    }
    public destroyZidan() {
        this.zidanNode.destroy()
    }
    public playboomAnim(cb:Function = null) {
        this.animNode.active = true
        this.animNode.getComponent(cc.Animation).play('clear1')
        this.animNode.on(cc.Animation.EventType.FINISHED,(()=>{
            cb && cb()
        }),this)
    }

}
