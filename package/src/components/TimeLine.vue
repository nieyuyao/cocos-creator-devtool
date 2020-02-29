<template>
    <div class="timeline">
        <div v-for="(period, idx) in periods" :key="idx" :class="['period', idx === periods.length - 1 ? 'last-period' : '']">
            <div class="tail"></div>
            <div class="point"></div>
            <div class="info">
                <p>{{period.time}}ms</p>
                <p>{{period.desc}}</p>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'TimeLine',
    props: {
        periods: {
            type: Array,
            default: []
        }
    }
}
</script>

<style lang="scss">
.timeline {
    .period {
        display: inline-block;
        position: relative;
        padding-right: 40px;
        .point {
            position: absolute;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: #409EFF;
        }
        .tail {
            position: absolute;
            top: 4px;
            width: 100%;
            border-top: 2px solid #e4e7ed;
        }
        .info {
            font-size: 12px;
            color: #909399;
        }
        &.last-period .tail {
            display: none;
        }
    }
}
</style>