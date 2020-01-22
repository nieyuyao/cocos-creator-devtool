<template>
    <div class="box">
        <!-- 全局坐标 -->
        <div class="global">
            <h3 class="title">Global</h3>
            <div 
                class="bounding"
                :class="{'bounding-hover': boundingHover, 'content-hover': wrapperHover}"
                @mouseover="mouseOver('global', 'bounding')"
                @mouseout="mouseOut('global', 'bounding')"
            >
                <!-- 坐标轴 -->
                <div class="axis-x"></div>
                <div class="axis-y"></div>
                <!-- 位置 -->
                <div class="wrapper">
                    <div
                        class="content"
                        @mouseover.stop="mouseOver('global', 'wrapper')"
                        @mouseout.stop="mouseOut('global', 'wrapper')"
                    >
                        <span>{{contentWidth}}×{{contentHeight}}</span>
                        <div class="place">
                            <div class="place-x">{{globalX}}</div>
                            <div class="place-y">{{globalY}}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="divide"></div>
        <!-- 屏幕坐标 -->
        <div class="screen">
            <h3 class="title">Screen</h3>
            <div
                class="parent"
                @mouseover="mouseOver('screen', 'parent')"
                @mouseout="mouseOut('screen', 'parent')"
            >
                <div class="place-top">{{screenTop}}</div>
                <div class="place-left">{{screenLeft}}</div>
                <div
                    class="child"
                    @mouseover.stop="mouseOver('screen', 'child')"
                    @mouseout.stop="mouseOut('screen', 'child')"
                >
                    <span>{{contentWidth}}×{{contentHeight}}</span>
                </div>
            </div>
        </div>
        <div class="divide"></div>
        <!-- 局部坐标 -->
        <div class="local">
            <h3 class="title">Local</h3>
            <div
                class="parent"
                :class="{'parent-hover': parentHover, 'child-hover': childHover}"
                @mouseover="mouseOver('local', 'parent')"
                @mouseout="mouseOut('local', 'parent')"
            >
                <div class="place-top">{{localTop}}</div>
                <div class="place-bottom">{{localBottom}}</div>
                <div class="place-left">{{localLeft}}</div>
                <div class="place-right">{{localRight}}</div>
                <div
                    class="child"
                    @mouseover.stop="mouseOver('local', 'child')"
                    @mouseout.stop="mouseOut('local', 'child')"
                >
                    <span>{{contentWidth}}×{{contentHeight}}</span>
                </div>
            </div>
        </div>
    </div>
</template>
<style lang="scss">
.title {
    color: #409EFF;
}
.global {
    .bounding {
        position: relative;
        width: 200px;
        height: 140px;
        margin: 40px 0 40px 40px;
        border: 1px dashed black;
        background-color:#f3cea5;
        &.bounding-hover {
            .content {
                background-color: #fff;
            }
        }
        &.content-hover {
            background-color:#fff;
            .wrapper {
                .place {
                    display: block;
                }
            }
        }
    }
    .axis-x {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 240px;
        height: 0px;
        border-top: 1px dotted black;
        transform: translate(-50%, -50%);
        &::after {
            content: "x";
            display: block;
            position: absolute;
            font-style: italic;
            bottom: 0;
            right: -10px;
        }
    }
    .axis-y {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0px;
        height: 180px;
        border-left: 1px dotted black;
        transform: translate(-50%, -50%);
        &::after {
            content: "y";
            display: block;
            position: absolute;
            font-style: italic;
            top: -10px;
            left: 10px;
        }
    }
    .wrapper {
        position: absolute;
        top: 10px;
        left: 20px;
        width: 50px;
        height: 20px;
        .content {
            position: absolute;
            top: 50%;
            left: 50%;
            padding: 2px 8px;
            border: 1px solid black;
            font-size: 10px;
            transform: translate(-50%, -50%);
            background-color: #a8c5e5;
            .place {
                display: none;
                position: absolute;
                top: 50%;
                left: 50%;
                width: 55px;
                height: 50px;
                border-top: 1px solid red;
                border-left: 1px solid red;
                color: red;
                font-size: 8px;
            }
            .place-x {
                position: absolute;
                right: 4px;
                text-align: right;
            }
            .place-y {
                position: absolute;
                left: 4px;
                bottom: 4px;
                text-align: left;
            }
        }
    }
}
.divide {
    height: 1px;
    background-color: #909399;
}
.local, .screen {
    .parent {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 200px;
        height: 140px;
        margin: 40px 0 40px 40px;
        border: 1px dashed black;
        background-color:#f3cea5;
        &.parent-hover {
            .child {
                background-color: #fff;
            }
        }
        &.child-hover {
            background-color: #fff;
        }
    }
    .child {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 120px;
        height: 60px;
        border: 1px solid black;
        font-size: 10px;
        background-color: #a8c5e5;        
    }
    [class*="place-"] {
        position: absolute;
    }
    .place-top {
        top: 6px;
        text-align: center;
    }
    .place-bottom {
        bottom: 6px;
        text-align: center;
    }
    .place-left {
        left: 6px;
        text-align: left;
    }
    .place-right {
        right: 6px;
        text-align: right;
    }
}
</style>

<script>
export default {
    name: 'Box',
    props: {
        bound: {
           type: Object,
           required: true,
           default: {}
        }
    },
    data() {
        return {
            // 控制全局盒子的显示
            boundingHover: false, // mouse是否浮动在boundingt元素上方
            wrapperHover: false, // mouse是否浮动在content元素上方
            // 控制局部盒子的显示
            parentHover: false, // mouse是否浮动在parent元素上方
            childHover: false, // mouse是否浮动在child元素上方
            // 控制屏幕盒子的显示
            screenParentHover: false, // mouse是否浮动在parent元素上方
            screenChildHover: false // mouse是否浮动在child元素上方
        }
    },
    computed: {
        globalX() {
            const { globalBound } = this.bound;
            return globalBound && typeof globalBound.x === 'number' ? Math.round(globalBound.x) : '-';
        },
        globalY() {
            const { globalBound } = this.bound;
            return globalBound && typeof globalBound.y === 'number' ? Math.round(globalBound.y) : '-';
        },
        localTop() {
            const { localBound } = this.bound;
            return localBound && typeof localBound.top === 'number' ? Math.round(localBound.top) : '-';
        },
        localBottom() {
            const { localBound } = this.bound;
            return localBound && typeof localBound.bottom === 'number' ? Math.round(localBound.bottom) : '-';
        },
        localLeft() {
            const { localBound } = this.bound;
            return localBound && typeof localBound.left === 'number' ? Math.round(localBound.left) : '-';
        },
        localRight() {
            const { localBound } = this.bound;
            return localBound && typeof localBound.right === 'number' ?  Math.round(localBound.right) : '-';
        },
        contentWidth() {
            const width = this.bound.width;
            return width ? Math.round(width) : '-';
        },
        contentHeight() {
            const height = this.bound.height;
            return height ? Math.round(height) : '-';
        },
        screenTop() {
            const { screenBound } = this.bound;
            return screenBound && typeof screenBound.top === 'number' ?  Math.round(screenBound.top) : '-';
        },
        screenLeft() {
            const { screenBound } = this.bound;
            return screenBound && typeof screenBound.left === 'number' ?  Math.round(screenBound.left) : '-';
        }
    },
    methods: {
        mouseOver(type, node) {
            const sign = `${type}-${node}`;
            const uuid = this.bound.uuid;
            switch (sign) {
                case 'global-bounding':
                    this.boundingHover = true;
                    break;
                case 'global-wrapper':
                    this.wrapperHover = true;
                    this.$emit('box-show', uuid);
                    break;
                case 'local-parent':
                    this.parentHover = true;
                    break;
                case 'local-child':
                    this.childHover = true;
                    this.$emit('box-show', uuid);
                case 'screen-parent':
                    this.screenParentHover = true;
                    break;
                case 'screen-child':
                    this.screenChildHover = true;
                    this.$emit('box-show', uuid);
                    break;
            }
        },
        mouseOut(type, node) {
            const sign = `${type}-${node}`;
            const uuid = this.bound.uuid;
            switch (sign) {
                case 'global-bounding':
                    this.boundingHover = false;
                    break;
                case 'global-wrapper':
                    this.wrapperHover = false;
                    this.$emit('box-hide', uuid);
                    break;
                case 'local-parent':
                    this.parentHover = false;
                    break;
                case 'local-child':
                    this.childHover = false;
                    this.$emit('box-hide', uuid);
                case 'screen-parent':
                    this.screenParentHover = false;
                    break;
                case 'screen-child':
                    this.screenChildHover = false;
                    this.$emit('box-hide', uuid);
                    break;
            }
        }
    }
}
</script>

