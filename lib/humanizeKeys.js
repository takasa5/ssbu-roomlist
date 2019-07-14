/**
 * 可読な名前の文字列と可読に変換する関数を含む。
 * @typedef {Object} NameFuncPair
 * @property {string} name
 * @property {function} toPrimitive
 */

/**
 * @type {Map.<string, NameFuncPair>}
 */
const humanizeKeys = new Map(
    Object.entries({
        icon: {
            name: "アイコン",
            toPrimitive: () => false
        },
        id: {
            name: "ID",
            toPrimitive: id => id.toString()
        },
        pass: {
            name: "パス",
            toPrimitive: pass => pass.toString()
        },
        power: {
            name: "戦闘力",
            toPrimitive: power => ((power ? `${power} 万` : false))
        },
        style: {
            name: "乱闘形式",
            toPrimitive: style => style.toString()
        },
        rule: {
            name: "ルール",
            toPrimitive: rule => rule.toString()
        },
        stock: {
            name: "ストック",
            toPrimitive: stock => stock.toString()
        },
        time: {
            name: "制限時間",
            toPrimitive: time => time.toString()
        },
        stage: {
            name: "ステージ",
            toPrimitive: stage => stage.toString()
        },
        custom: {
            name: "自作ステージ",
            toPrimitive: custom => ((custom ? "あり" : "なし"))
        },
        items: {
            name: "アイテム",
            toPrimitive: items => ((items ? "あり" : "なし"))
        },
        fs_charge: {
            name: "チャージ切り札",
            toPrimitive: fsCharge => ((fsCharge ? "あり" : "なし"))
        },
        change: {
            name: "入れ替え",
            toPrimitive: change => change.toString()
        },
        capacity: {
            name: "部屋人数",
            toPrimitive: capacity => capacity.toString()
        },
        deadline: {
            name: "終了予定時刻",
            toPrimitive: deadline => deadline.toString()
        },
        overview: {
            name: "コメント",
            toPrimitive: overview => overview.toString()
        },
        cast_url: {
            name: "配信URL",
            toPrimitive: castUrl => castUrl.toString()
        }
    })
);

module.exports = humanizeKeys;
