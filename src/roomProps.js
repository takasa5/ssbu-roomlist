/**
 * 部屋の情報から配信欄の表示文章を算出する。
 * @returns {Object} 配信のステータス文章とCSSのクラス。
 */
export function castText(room) {
    if (room.cast_url.length > 0) {
        // 配信URLが登録されている場合
        // 配信中のテンプレートを戻す。
        return { text: "配信中", class: "cast-airing" };
    }
    switch (room.cast) {
        case "allow":
            return { text: "配信可能", class: "cast-allowed" };
        case "disallow":
            return { text: "配信なし", class: "cast-not-allowed" };
        default:
            return { text: "未選択", class: "cast-not-allowed" };
    }
}

/**
 * 部屋の情報からクラスを決定する。
 * @param {Object} room 部屋オブジェクト。
 * @returns {Object.<String, Boolean>} クラスの情報を格納したオブジェクト。
 */
export function roomClass(room) {
    const classes = {
        full: parseInt(room.member, 10) >= parseInt(room.capacity, 10)
    };

    if (room.custom) {
        classes["room-custom"] = true;
    } else {
        switch (room.style) {
            case "乱闘":
                classes["room-brawl"] = true;
                break;
            case "チーム乱闘":
                classes["room-team"] = true;
                break;
            case "1on1":
                classes["room-1on1"] = true;
                break;
            default:
                break;
        }
    }

    return classes;
}
