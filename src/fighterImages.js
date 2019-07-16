/**
 * 画像のURLを格納する配列。
 * @type {String[]}
 */
const images = new Array(107);
// eslint-disable-next-line no-plusplus
for (let i = images.length; i--; ) {
    images[i] = `/img/${i}.jpg?0716`;
}
export default images;
