export const enum JarType{
    Orange = 0,
    Pink = 1,
    Green = 2
}
export const enum BoxType{
    Blue = 0,
    Red = 1,
    Yellow = 2,
    Money = 3
}
export class GameConf{
    public static BoxColMunNum = 8
    public static BoxRowNum = 8

    /**每个box的列间距 */
    public static BoxColumnGap = 65
   /**每个box的行间距 */
    public static BoxRowGap = 65
    /**第0列box的x坐标 */
    public static BoxFirstX = -231.5
    /**第0行box的y坐标 */
    public static BoxFirstY = -220
    /**游戏数据配置 */
    public static GameDataArr = [
        [3,3,3,3,3,3,3,3],
        [2,2,2,2,1,1,1,1],
        [2,2,2,0,0,1,1,1],
        [2,2,0,2,1,0,1,1],
        [2,0,2,2,1,1,0,1],
        [2,2,2,2,1,1,1,1],
        [2,2,0,2,1,0,1,1],
        [2,2,2,2,1,1,1,1],
    ]
}

window['GameConf'] = GameConf