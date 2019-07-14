/**
 * SHA3-256 → RIPEMD-160 でハッシュを計算した後 Modular Crypt Format で出力する。
 * ソルト長: 128 bit
 * ハッシュ長: 160 bit
 * 出力長: 53 char
 * @module lib/bitHash
 */

/*
▒▒▒▒▒▒▒▒▄▄▄▄▄▄▄▄▒▒▒▒▒▒▒▒
▒▒▒▒▒▄█▀▀░░░░░░▀▀█▄▒▒▒▒▒
▒▒▒▄█▀▄██▄░░░░░░░░▀█▄▒▒▒
▒▒█▀░▀░░▄▀░░░░▄▀▀▀▀░▀█▒▒
▒█▀░░░░███░░░░▄█▄░░░░▀█▒
▒█░░░░░░▀░░░░░▀█▀░░░░░█▒
▒█░░░░░░░░░░░░░░░░░░░░█▒
▒█░░██▄░░▀▀▀▀▄▄░░░░░░░█▒
▒▀█░█░█░░░▄▄▄▄▄░░░░░░█▀▒
▒▒▀█▀░▀▀▀▀░▄▄▄▀░░░░▄█▀▒▒
▒▒▒█░░░░░░▀█░░░░░▄█▀▒▒▒▒
▒▒▒█▄░░░░░▀█▄▄▄█▀▀▒▒▒▒▒▒
▒▒▒▒▀▀▀▀▀▀▀▒▒▒▒▒▒▒▒▒▒▒▒▒
 */

const crypto = require("crypto");
const checkTypes = require("./checkTypes");

const version = "bh1";
const saltBytes = 16;

module.exports = {
    create(original, salt = crypto.randomBytes(saltBytes)) {
        checkTypes("string", original);

        if (!(salt instanceof Buffer)) {
            throw new TypeError("salt is not a buffer");
        }

        if (salt.byteLength !== saltBytes) {
            throw new RangeError("Invalid salt length");
        }

        let hash = Buffer.concat([salt, Buffer.from(original, "utf-8")]);

        for (const type of ["sha3-256", "ripemd160"]) {
            const generator = crypto.createHash(type);
            generator.update(hash);
            hash = generator.digest();
        }

        return ["", version, Buffer.concat([salt, hash]).toString("base64")].join("$");
    },
    verify(data, hash) {
        checkTypes("string", data, hash);

        const parts = hash.split("$");

        if (hash.length !== 53 || parts[1] !== version || parts.length !== 3) {
            throw new TypeError("Not a valid BitHash1");
        }

        if (this.create(data, Buffer.from(parts[2], "base64").slice(0, saltBytes)) === hash) {
            return true;
        }
        return false;
    }
};
