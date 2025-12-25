import { BoxType, GameConf } from "./GameConf";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BoxItem extends cc.Component {
    @property(cc.Node)
    boxNode: cc.Node = null;
    @property(cc.SpriteFrame)
    boxFrameArr: cc.SpriteFrame[] = [];

    _colMun: number = -1
    _rowNum: number = -1
    _boxId: number = -1
    start() {

    }
    initBoxItem(boxId: number, boxType: number, colMun: number, rowNum: number) {
        if (boxType == BoxType.Money) {
            let lang = ''
            if (cc.sys.language == 'zh') {
                lang = 'us'
            } else {
                lang = cc.sys.language
            }
            let res = `jinbi/${lang}`;
            if(cc.sys.language == 'zh'){
                res = `jinbi/${lang}`
            }else{
                let country = cc.sys.languageCode.split('-')[1]
                res = `jinbi/${country}`
            }
            cc.loader.loadRes(`/pay/${res}`, cc.SpriteFrame, (error, res) => {
                if (error) {
                    console.log("error = ", error);
                    return;
                }
                this.boxNode.getComponent(cc.Sprite).spriteFrame = res;
            });
        } else {
            this.boxNode.getComponent(cc.Sprite).spriteFrame = this.boxFrameArr[boxType];
        }
        this.node.name = boxId.toString();
        this.node.setSiblingIndex(-boxId);
        this._boxId = boxId;
        this._colMun = colMun;
        this._rowNum = rowNum;
    }

    get colMun(): number {
        return this._colMun;
    }
    set colMun(value: number) {
        this._colMun = value;
    }
    get rowNum(): number {
        return this._rowNum;
    }
    set rowNum(value: number) {
        this._rowNum = value;
    }
    get boxId(): number {
        return this._boxId;
    }
    set boxId(value: number) {
        this._boxId = value;
    }

}
