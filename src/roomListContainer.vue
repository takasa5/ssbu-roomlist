<template>
    <div>
        <div v-if="roomList.length === 0" class="center-text">現在立っている部屋はありません。</div>
        <room-list v-for="room in roomList" v-bind:key="room.key" v-bind:room="room" />
    </div>
</template>

<script>
export default {
    el: "#app",
    data() {
        return {
            roomList: []
        };
    }
};
</script>
