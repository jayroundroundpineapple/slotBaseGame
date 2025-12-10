
const { ccclass, property } = cc._decorator;

@ccclass
export default class slotItem extends cc.Component {
    @property(cc.Node)
    private itemNode: cc.Node = null;
    
    _spriteIdx:number = -1;
    initItem(spriteIndex:number){
        cc.loader.loadRes(`/slot/slot${spriteIndex}`, cc.SpriteFrame, (err, spriteFrame) => {
            if (err) {
                return
            }
            this.itemNode.getComponent(cc.Sprite).spriteFrame = spriteFrame
        })
    }
    set spriteIndex(idx:number){
        this._spriteIdx = idx;
    }
    get spriteIndex():number{
        return this._spriteIdx;
    }

    protected onDisable(): void {
    }
}

