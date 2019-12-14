export function log(...args) {
    args.unshift('background:rgb(51,51,51); color: #bdbdbd;font-size: 12px; padding: 0;');
    args.unshift('%c[cc-devtool] ▶ ');
    return console.log.apply(console, args);
}
export function warn(...args) {
    args.unshift('background:rgb(51,51,51); color: #bdbdbd;font-size: 12px; padding: 0;');
    args.unshift('%c[cc-devtool] ▶ ');
    return console.warn.apply(console, args);
}
export function error(...args) {
    args.unshift('background:rgb(51,51,51); color: #bdbdbd;font-size: 12px; padding: 0;');
    args.unshift('%c[cc-devtool] ▶ ');
    return console.error.apply(console, args);
}