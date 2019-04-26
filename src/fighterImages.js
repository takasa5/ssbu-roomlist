/**
 * 画像のURLを格納する配列。
 * @type {String[]}
 */
const images = new Array(106);
// eslint-disable-next-line no-plusplus
for (let i = images.length; i--; ) {
    images[i] = `/static/img/${i}.jpg?0427`;
}
export default images;
