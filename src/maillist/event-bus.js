/*
 * @Description: 事件总线用于组件间通信
 * @Author: jiangy
 * @Date: 2019-06-11 10:58:31
 * @Version 1.1.0
 */

import onfire from "onfire.js";

const EventBus = new onfire();
console.log("EventBus onfire", EventBus);
export default EventBus;
