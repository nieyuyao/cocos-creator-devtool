<template>
    <div class="box">
        <!-- 全局坐标 -->
        <div class="global">
            <h3 class="title">Global</h3>
            <div class="bounding">
                <!-- 坐标轴 -->
                <div class="axis-x"></div>
                <div class="axis-y"></div>
                <!-- 位置 -->
                <div class="wrapper">
                    <div class="content">
                        <span>{{contentWidth}}×{{contentHeight}}</span>
                        <div class="place">
                            <div class="place-x">{{globalX}}</div>
                            <div class="place-y">{{globalY}}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- 局部坐标 -->
        <div class="local">
            <h3 class="title">Local</h3>
            <div class="parent">
                <div class="place-top">{{localTop}}</div>
                <div class="place-bottom">{{localBottom}}</div>
                <div class="place-left">{{localLeft}}</div>
                <div class="place-right">{{localRight}}</div>
                <div class="child">
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
        width: 220px;
        height: 140px;
        margin: 40px 0 40px 40px;
        border: 1px dashed black;
        &:hover {
            background-color:#f3cea5;
        }
    }
    .axis-x {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 260px;
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
            background-color: #fff;
            transform: translate(-50%, -50%);
            &:hover {
                background-color: #a8c5e5;
                .place {
                    display: block;
                }
            }
            .place {
                display: none;
                position: absolute;
                top: 50%;
                left: 50%;
                width: 65px;
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
.local {
    .parent {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 220px;
        height: 140px;
        margin: 40px 0 40px 40px;
        border: 1px dashed black;
        &:hover {
            background-color:#f3cea5;
        }
    }
    .child {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 120px;
        height: 60px;
        background-color: #fff;
        border: 1px solid black;
        font-size: 10px;
        &:hover {
            background-color: #a8c5e5;
            .place {
                display: block;
            }
        }
        
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
    computed: {
        globalX() {
            const { globalBound } = this.bound;
            if (globalBound && typeof globalBound.x === 'number') {
                return globalBound.x;
            }
            return '-';
        },
        globalY() {
            const { globalBound } = this.bound;
            if (globalBound && typeof globalBound.y === 'number') {
                return globalBound.y;
            }
            return '-';
        },
        localTop() {
            const { localBound } = this.bound;
            if (localBound && typeof localBound.top === 'number') {
                return localBound.top;
            }
            return '-';
        },
        localBottom() {
            const { localBound } = this.bound;
            if (localBound && typeof localBound.bottom === 'number') {
                return localBound.bottom;
            }
            return '-';
        },
        localLeft() {
            const { localBound } = this.bound;
            if (localBound && typeof localBound.left === 'number') {
                return localBound.left;
            }
            return '-';
        },
        localRight() {
            const { localBound } = this.bound;
            if (localBound && typeof localBound.right === 'number') {
                return localBound.right;
            }
            return '-';
        },
        contentWidth() {
            const { globalBound, localBound } = this.bound;
            if (globalBound && typeof globalBound.width === 'number') {
                return globalBound.width;
            }
            else if (localBound && typeof localBound.widt === 'number') {
                return localBound.width;
            }
            return '-';
        },
        contentHeight() {
            const { globalBound, localBound } = this.bound;
            if (globalBound && typeof globalBound.height === 'number') {
                return globalBound.height;
            }
            else if (localBound && typeof localBound.height === 'number') {
                return localBound.height;
            }
            return '-';
        }
    }
}
</script>

