<template>
    <div class="caches">
        <ElTable :data="caches">
            <ElTableColumn prop="type" label="Type"></ElTableColumn>
            <ElTableColumn prop="name" label="Name"></ElTableColumn>
            <ElTableColumn prop="size" label="Size"></ElTableColumn>
            <ElTableColumn prop="preview" label="Preview">
                <img v-if="data.row.preview" :src="data.row.preview" slot-scope="data" class="preview">
                <span v-else>-</span>
            </ElTableColumn>
        </ElTable>
    </div>
</template>

<script>
export default {
    name: 'Caches',
    props: {
        caches: {
            type: Array,
            default() {
                return [];
            }
        }
    }
}
</script>

<style lang="scss">
.caches {
    .preview {
        width: 40px;
    }
}
</style>