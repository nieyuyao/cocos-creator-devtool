<template>
    <div class="box">
        <!-- 全局坐标 -->
        <div class="global">
            <h3 class="title">Global</h3>
            <div 
                class="bounding"
                :class="{'bounding-hover': boundingHover, 'content-hover': wrapperHover}"
                @mouseover="handleGlobalBoundingMouseEnter"
                @mouseout="handleGlobalBoundingMouseLeave"
            >
                <!-- 坐标轴 -->
                <div class="axis-x"></div>
                <div class="axis-y"></div>
                <!-- 位置 -->
                <div class="wrapper">
                    <div
                        class="content"
                        @mouseover.stop="handleGlobalContentMouseEnter"
                        @mouseout.stop="handleGlobalContentMouseLeave"
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
        <!-- 屏幕坐标 -->
        <div class="Screen"></div>
        <div class="divide"></div>
        <!-- 局部坐标 -->
        <div class="local">
            <h3 class="title">Local</h3>
            <div
                class="parent"
                :class="{'parent-hover': parentHover, 'child-hover': childHover}"
                @mouseover="handleLocalParentMouseEnter"
                @mouseout="handleLocalParentMouseLeave"
            >
                <div class="place-top">{{localTop}}</div>
                <div class="place-bottom">{{localBottom}}</div>
                <div class="place-left">{{localLeft}}</div>
                <div class="place-right">{{localRight}}</div>
                <div
                    class="child"
                    @mouseover.stop="handleLocalChildMouseEnter"
                    @mouseout.stop="handleLocalChildMouseLeave"
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
        height: 200px;
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
        height: 240px;
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
                height: 80px;
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
.local {
    .parent {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 200px;
        height: 200px;
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
            wrapperHover: false,
            boundingHover: false,
            parentHover: false,
            childHover: false
        }
    },
    computed: {
        globalX() {
            const { globalBound } = this.bound;
            if (globalBound && typeof globalBound.x === 'number') {
                return Math.round(globalBound.x);
            }
            return '-';
        },
        globalY() {
            const { globalBound } = this.bound;
            if (globalBound && typeof globalBound.y === 'number') {
                return  Math.round(globalBound.y);
            }
            return '-';
        },
        localTop() {
            const { localBound } = this.bound;
            if (localBound && typeof localBound.top === 'number') {
                return  Math.round(localBound.top);
            }
            return '-';
        },
        localBottom() {
            const { localBound } = this.bound;
            if (localBound && typeof localBound.bottom === 'number') {
                return  Math.round(localBound.bottom);
            }
            return '-';
        },
        localLeft() {
            const { localBound } = this.bound;
            if (localBound && typeof localBound.left === 'number') {
                return  Math.round(localBound.left);
            }
            return '-';
        },
        localRight() {
            const { localBound } = this.bound;
            if (localBound && typeof localBound.right === 'number') {
                return Math.round(localBound.right);
            }
            return '-';
        },
        contentWidth() {
            const { globalBound, localBound } = this.bound;
            if (globalBound && typeof globalBound.width === 'number') {
                return Math.round(globalBound.width);
            }
            else if (localBound && typeof localBound.widt === 'number') {
                return Math.round(localBound.width);
            }
            return '-';
        },
        contentHeight() {
            const { globalBound, localBound } = this.bound;
            if (globalBound && typeof globalBound.height === 'number') {
                return Math.round(globalBound.height);
            }
            else if (localBound && typeof localBound.height === 'number') {
                return Math.round(localBound.height);
            }
            return '-';
        }
    },
    methods: {
        handleGlobalBoundingMouseEnter(event) {
            this.boundingHover = true;
        },
        handleGlobalBoundingMouseLeave() {
            this.boundingHover = false;
        },
        handleGlobalContentMouseEnter() {
            this.wrapperHover = true;
            //
            this.$emit('box-show', bound.uuid);
        },
        handleGlobalContentMouseLeave() {
            this.wrapperHover = false;
            this.$emit('box-hide', bound.uuid);
        },
        handleLocalParentMouseEnter() {
            this.parentHover = true;
        },
        handleLocalParentMouseLeave() {
            this.parentHover = false;
        },
        handleLocalChildMouseEnter() {
            this.childHover = true;
            //
            this.$emit('box-show', bound.uuid);
        },
        handleLocalChildMouseLeave() {
            this.childHover = false;
        }
    }
}
</script>

