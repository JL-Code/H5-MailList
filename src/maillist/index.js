"use strict";
import $ from "../util";
import axios from "../plugins/axios";
import { findNode } from "./maillist.util";
import mailListTpl from "../template/maillist";

/**
 * @description 通讯录组件
 * @param {Object} options 参数选项
 *  options = {
    fromDepartmentId: 0, // 必填，-1表示打开的通讯录从自己所在部门开始展示, 0表示从最上层开始
    mode: "multi", // 必填，选择模式，single表示单选，multi表示多选
    type: ["user"], // 必填，选择限制类型，指定department、user中的一个或者多个
    selectedDepartmentIds: [], // 非必填，已选部门ID列表。用于多次选人时可重入
    selectedUserIds: [] // 非必填，已选用户ID列表。用于多次选人时可重入
  };
 */
function MailList(options) {
  let defaults = {
    // 挂载元素
    el: ""
  };
  this.options = Object.assign({}, defaults, options);
  // 挂载元素
  if (typeof this.options.el === "string") {
    this.$container = document.querySelector(this.options.el);
  } else {
    this.$container = this.options.el;
  }
  // 选中的用户信息
  this.userList = new Map();
  this.tempUserList = new Map();
  // 选中的部门信息
  this.departmentList = [];
  // 导航信息
  this.navs = [];
  // tree 数据
  this.data = [];

  bindEvents.call(this);
}

/**
 * @description 组件绑定事件
 * @private
 */
function bindEvents() {
  let _this = this;
  _this.$container
    .on("click", ".weui-cell.organization", function(e) {
      // TODO: 1. 获取指定节点的下级节点
      // TODO: 2. 查询指定节点的下直接用户成员

      let target = e.target.closest(".weui-cell.organization");
      let dataset = target.dataset;
      let loading = weui.loading("加载中");
      fetchUser(dataset.code)
        .then(res => {
          loading.hide();
          if (res.data.ErrCode !== 0) {
            return Promise.reject(res.data);
          }
          let users = res.data.Result;
          // target.dataset.users = JSON.stringify(users);
          // TODO: 3. 渲染View
          updateView.call(_this, target, users);
        })
        .catch(err => {
          loading.hide();
          weui.topTips(err.ErrMsg);
          console.error(err);
        });
    })
    .on("click", ".maillist-btn_confirm", function() {
      // TODO: 用户点击了确认按钮，需要关闭通讯录界面并将临时勾选用户添加到userList
      console.log("_this.getUsers()：", _this.getUsers());
    })
    .on("click", ".nav__item", function(e) {
      updateView.call(_this, e.target);
    });

  // 事件注册
  this.$container.on("change", "input", onChanged);

  // 事件处理函数

  function onChanged(e) {
    let target = e.target;
    let dataset = target.dataset;
    // TODO: 添加选中用户到userList
    // Map 重复set 会覆盖上一次value
    if (target.checked) {
      _this.userList.set(dataset.id, JSON.parse(dataset.user));
    } else {
      _this.userList.delete(dataset.id);
    }
  }
}

/**
 * @description UI渲染
 * @param {Object} data 起始节点数据「根」
 */
function render(data) {
  console.log("render data", data);
  // TODO: 待优化数据结构和更新机制
  let source = {
    ID: "",
    Name: "",
    Children: [],
    Users: data.Users || [],
    Header: { Navs: this.navs },
    Footer: { Count: this.userList.size }
  };
  if (Array.isArray(data)) {
    source = Object.assign({}, source, {
      ID: data[0].ID,
      Name: data[0].Name,
      Children: data
    });
  } else {
    source = Object.assign({}, source, data);
  }
  // 通知 navs 做出反应,
  source.Header.Navs = updateNavs.call(this, source);
  let html = mailListTpl(source);
  this.$container.html(html);
  weui.searchBar(".weui-search-bar");
}

/**
 * @description 更新导航【封装，navs 应提供一个封装好的方法、里面应该做重复键检查、及其他一些业务逻辑】
 * @param {Object} node
 */
function updateNavs(node) {
  let exists = false;
  let existsIndex = -1;
  // 更新面包屑导航
  let nav = {
    id: node.ID,
    text: node.Name,
    active: true
  };
  // 默认不存在该元素
  this.navs.forEach((c, index) => {
    c.active = false;
    if (c.id === nav.id) {
      c.active = true;
      exists = true;
      existsIndex = index;
    }
  });
  if (!exists) {
    this.navs.push(nav);
  }
  if (existsIndex > -1) {
    // 移除该元素后所有元素
    this.navs.splice(existsIndex + 1);
  }

  return this.navs;
}
/**
 * @description //TODO: 数据变化==>更新视图
 * @param {DOM} target 触发事件的DOM对象
 * @param {Array} users 用户信息
 */
function updateView(target, users = []) {
  let dataset = target.dataset;
  let node = findNode(dataset.id, this.data);
  console.log("updateView", users);
  console.log("node", node);
  if (node) {
    node.Users = node.Users && node.Users.length ? node.Users : users;
    render.call(this, node);
  } else {
    console.error("node is notfound", dataset);
  }
}

/**
 * @description 从远程获取数据（在open后请求数据，且在生命周期内只请求一次）
 */
function request(callback) {
  let url = this.options.url;
  if (!url) return;
  let loading = weui.loading("加载中");
  axios
    .get(url)
    .then(res => {
      loading.hide();
      if (res.data.ErrCode !== 0) {
        return Promise.reject(res.data);
      }
      this.data = res.data.Result;
      render.apply(this, this.data);
    })
    .catch(err => {
      loading.hide();
      this.data = [];
      weui.topTips(err.ErrMsg);
      console.error(err);
    });
}

/**
 * @description 获取指定组织下的用户
 * @param {String} code 组织层级编码
 */
function fetchUser(code) {
  let url = `http://meunsc.oicp.net:47941/api/v2/organization/users?hierarchyCode=${code}`;
  return axios.get(url);
}

// 对外方法
MailList.prototype.getUsers = function() {
  let values = this.userList.values();
  let userArr = Array.from(values);
  return userArr;
};
/**
 * @description 打开通讯录选择界面
 */
MailList.prototype.open = function() {
  // 加载数据
  request.call(this, fetchUser);
};

/**
 * @description 取消通讯录选择
 */
MailList.prototype.cancel = function() {
  // TODO: 关闭通讯录选择界面
};

/**
 * @description 加载本地数据
 */
MailList.prototype.loadData = function(data) {
  this.data = data;
  render.apply(this, data);
};

export default MailList;
