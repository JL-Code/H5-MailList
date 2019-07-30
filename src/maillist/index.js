/*
 * @Description: MailList 通讯录组件
 * @Author: jiangy
 * @Date: 2019-06-10 16:45:42
 */

"use strict";
import onfire from "onfire.js";
import axios from "../plugins/axios";
import { findNode } from "./maillist.util";
import icons from "../assets/base64";
import Picker from "./components/picker";
import { SearchBar } from "./components/searchbar";
import mailListTpl from "./templates/maillist";
import maillistResultTpl from "./templates/maillist-result";
import linkmanAvatarTpl from "./templates/linkman-avatar";

import "../style/maillist.less";
import "../style/maillist-input.less";
import "../style/searchbar.less";

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
 * @todo //TODO: searchbar、picker、mailist通信问题。
 */
export function MailList(options) {
  this._eventbus = new onfire();
  // TODO: 挂载元素 考虑取消挂载在实例上，而采用私有变量
  // 配置参数
  this.options = $.extend(
    {
      // 挂载元素
      el: "",
      mode: "multi",
      type: ["user"],
      label: "联系人",
      server: "",
      url: "",
      queryParams: {},
      selectedUserIds: [],
      onConfirm: $.noop,
      onClose: $.noop,
      onBeforeClose: $.noop
    },
    options
  );

  // 用户信息
  this.users = {
    // 组件打开选择联系人页面期间存放的用户列表
    activeUsers: new Map(),
    //
    lazyUsers: new Map()
  };
  // 导航信息
  this.navs = [];
  // tree 数据
  this.data = [];
  // 弹层
  this.picker = null;
  // 搜索
  this.searchbar = null;
  this.render = function(data) {
    // TODO: 待优化数据结构和更新机制
    let source = {
      mode: this.options.mode,
      icons: icons,
      ID: "",
      Name: "",
      Children: [],
      Users: data.Users || [],
      Header: { Navs: this.navs },
      Footer: { Count: this.users.lazyUsers.size + this.users.activeUsers.size }
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
    // console.log("selectedUserIds", this.options.selectedUserIds);
    const selectedUserIds = this.options.selectedUserIds;
    // TODO: 临时解决切换nav DOM更新导致input 的勾选状态消失问题。
    for (const user of source.Users) {
      user.checked = false;
      if (
        selectedUserIds.indexOf(user.ID) !== -1 &&
        !this.users.lazyUsers.has(user.ID)
      ) {
        // 重入
        this.users.lazyUsers.set(user.ID, user);
      }
      if (
        this.users.activeUsers.has(user.ID) ||
        this.users.lazyUsers.has(user.ID)
      ) {
        user.checked = true;
      }
    }
    // 通知 navs 做出反应,
    source.Header.Navs = updateNavs.call(this, source);
    // 渲染
    if (this.options.mode === "multi") {
      this.updateDOM("count");
    }

    let html = mailListTpl(source);
    this.picker.$picker.find(".weui-picker__bd").html(html);
    const _this = this;
    // 在MailList html 加入 DOM 树后初始 searchbar
    this.searchbar = new SearchBar(
      {
        el: "#searchbar",
        url: `${_this.options.server}/api/v2/organization_tree/users_search`,
        method: "get",
        mode: _this.options.mode
      },
      _this._eventbus
    );
  };
  let _this = this;
  // 监听（listen）searchbar 的事件。
  _this._eventbus.on("search", function(value) {
    let currentNav = _this.navs.find(nav => nav.active);
    let data = {
      params: {
        orgGUID: currentNav.id,
        keyword: value
      }
    };
    _this.searchbar.search(data, _this._getCurrentIds());
  });
  this.init();
}

/**
 * @description 组件绑定事件
 * @private
 */
function bindEvents() {
  let _this = this;
  // TODO: 弹层的事件注册
  _this.picker.$picker
    .on("click", ".weui-cell.organization", function(e) {
      // TODO: 1. 获取指定节点的下级节点
      // TODO: 2. 查询指定节点的下直接用户成员 3.fetchUser与request应合并处理。
      let target = e.target.closest(".weui-cell.organization");
      let dataset = target.dataset;
      let loading = weui.loading("加载中");
      fetchUser(_this.options.server + _this.options.url, dataset.id)
        .then(res => {
          loading.hide();
          if (res.data.ErrCode !== 0) {
            return Promise.reject(res.data);
          }
          let users = res.data.Result;
          console.debug("fetchUser loadSuccess");
          // TODO: 3. updateView 与 render 应该考虑合并或者重新设计。
          updateView.call(_this, target, users);
        })
        .catch(err => {
          loading.hide();
          weui.topTips(err.ErrMsg);
          console.error(err);
        });
    })
    .on("click", ".nav__item", function(e) {
      let target = e.target.closest(".nav__item");
      updateView.call(_this, target);
    });
  // 事件注册
  this.picker.$picker
    .off("chagne", "input.weui-check")
    .on("change", "input.weui-check", onChanged);

  // 订阅了用户勾选改变事件
  function onChanged(e) {
    let target = e.target;
    let dataset = target.dataset;
    // 用户的操作都在activeUsers中
    let { activeUsers, lazyUsers } = _this.users;
    // Map 重复 call set 会覆盖上一次value
    // TODO: 需要考虑解决关闭重新打开组件带值重入，CheckBox 勾选问题。
    // TODO: 处理单选
    if (_this.options.mode === "single") {
      activeUsers.clear();
    }
    if (target.checked) {
      let user = JSON.parse(dataset.user);
      user.checked = target.checked;
      activeUsers.set(dataset.id, user);
    } else {
      // 尝试在 activeUsers、lazyUsers 中移除对应的 user
      activeUsers.delete(dataset.id);
      lazyUsers.delete(dataset.id);
    }
    if (_this.options.mode === "multi") {
      // 派发更新
      _this.updateDOM("count");
    }
    // 更新当前组织下的用户列表
    // _this.updateView();
    if (_this.options.mode === "single") {
      // 发送 confirm 事件。
      _this._eventbus.emit("_confirm", _this.options.mode);
    }
  }
}

// TODO: navs 在点击部门后统计并显示部门人数
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
 * 更新用户列表DOM
 * @param {Element} target
 * @param {Array} users 用户数据
 */
function updateView(target, users = []) {
  let dataset = target.dataset;
  let node = findNode(dataset.id, this.data);
  console.debug("updateView", users);
  console.debug("node", node);
  if (node) {
    node.Users = node.Users && node.Users.length ? node.Users : users;
    console.debug("node.Users", node.Users);
    console.debug("node.active", this.users.activeUsers);

    this.render(node);
  } else {
    console.error("node is notfound", dataset);
  }
}

/**
 * @description 获取指定组织下的用户
 * @param {String} prefix api前缀
 * @param {String} code 组织层级编码
 */
function fetchUser(prefix, orgGUID) {
  let url = `${prefix}/users_search?orgGUID=${orgGUID}`;
  return axios.get(url);
}

// 所有实例共享方法

/**
 *
 */
function init() {
  let _this = this;
  // TODO: 需要考虑多实例情况,是否需要采取this.forEach
  // let element = document.querySelector(this.options.el);
  // element.classList.add("weui-panel");
  let $box = $(
    maillistResultTpl({
      label: this.options.label,
      mode: this.options.mode,
      Users: []
    })
  );
  $(this.options.el).append($box);

  $box
    .on("click", ".maillist-action_add", function(e) {
      _this.open();
    })
    .on("click", ".maillist-result__item>.avatar", function(e) {
      if (_this.options.mode === "single") {
        let clist = e.target.classList;
        if (clist.contains("maillist-action")) {
          return;
        }
        _this.open();
      }
    })
    .on("click", ".maillist-action_close", function(e) {
      let dataset = e.target.dataset;
      _this.remove(dataset.id);
    });
}

// 从远程获取数据（在open后请求数据，且在生命周期内只请求一次）
function request() {
  let url = this.options.server + this.options.url;
  if (!url) return;
  let loading = weui.loading("加载组织中");
  axios
    .get(url, { params: this.options.queryParams })
    .then(res => {
      loading.hide();
      if (res.data.ErrCode !== 0) {
        return Promise.reject(res.data);
      }
      // TODO: 返回树只有一颗则直接传递树对象。
      if (res.data.Result.length === 1) {
        this.loadData(res.data.Result[0]);
      } else {
        this.loadData(res.data.Result);
      }
    })
    .catch(err => {
      loading.hide();
      this.data = [];
      weui.topTips(err.ErrMsg);
      console.error(err);
    });
}

/**
 * @description 更新用户信息
 * @summary 1.将activeUsers的元素移动到lazyUsers中 2.清空activeUsers
 */
function updateUsers() {
  const { activeUsers, lazyUsers } = this.users;

  if (this.options.mode === "single") {
    let user = activeUsers.values().next().value;
    if (user) {
      lazyUsers.clear();
      lazyUsers.set(user.ID, user);
    }
  } else if (this.options.mode === "multi") {
    activeUsers.forEach((value, key) => {
      lazyUsers.set(key, value);
    });
  } else {
    console.error("invalid mode");
  }
  // 更新selectedUserIds
  this.options.selectedUserIds = this.getValues().map(m => m.ID);
  activeUsers.clear();
}

// 移除选中的值
function remove(id) {
  this.users.lazyUsers.delete(id);
  this.options.selectedUserIds = this.getValues().map(m => m.ID);
  this.updateDOM("maillist-input");
}

/**
 * @description 获取选中的用户ID
 * @returns [{id:"",name:"",avatar:""}]
 * @public
 */
function getValues() {
  const values = this.users.lazyUsers.values();
  return Array.from(values);
}

/**
 * @description 获取选中的用户
 * @returns [{id:"",name:"",avatar:""}]
 * @public
 */
function getUsers() {
  var values = this.getValues();
  return values.map(v => {
    return {
      id: v.ID,
      name: v.Name,
      avatar: v.Avatar
    };
  });
}
/**
 * @description 获取当前组件已选用户ID集合
 */
function _getCurrentIds() {
  var lazyIds = Array.from(this.users.lazyUsers.keys());
  var activeIds = Array.from(this.users.activeUsers.keys());
  return lazyIds.concat(activeIds);
}

/**
 * @description 打开通讯录选择界面
 */
function open() {
  let _this = this;
  // 打开picker
  let picker = new Picker(
    {
      className: this.options.className,
      onClose: function() {
        _this.users.activeUsers.clear();
      },
      onConfirm: function() {
        _this.updateUsers();
        _this.updateDOM("maillist-input");
        _this.options.onConfirm(_this.getValues());
      }
    },
    _this._eventbus
  );
  picker.open();
  //TODO: 赋值Picker、SearchBar
  this.picker = picker;
  bindEvents.call(this);
  this.request();
}

// 加载数据
function loadData(data) {
  this.data = data;
  this.render(data);
}

// =============================DOM操作=================================
/**
 * @description 更新DOM树
 */
function updateDOM(type) {
  let html = "";
  switch (type) {
    case "count":
      let count = this.users.lazyUsers.size + this.users.activeUsers.size;
      // let html = `已选择:${count}人`;
      html = count ? `( ${count} ) 确定` : "确定";
      this.picker.$picker.find(".weui-picker-confirm").html(html);
      break;
    case "maillist-input":
      // TODO: 更新已选中结果
      html = linkmanAvatarTpl({
        Users: this.getValues(),
        mode: this.options.mode
      });
      $(this.options.el)
        .find(".maillist-result")
        .html(html);
      break;
    default:
      break;
  }
}

/**
 * 将成员放置在prototype属性上后实质是将成员放到原型对象上。
 * ```js
 * ```
 * 所有注意通过此原型创建的所有实例都共享这些成员，也意味着所有一旦这些成员被修改那么所有的实例对象都会受到影响。
 */
MailList.prototype.init = init;
MailList.prototype.open = open;
MailList.prototype.loadData = loadData;
MailList.prototype.request = request;
MailList.prototype.updateDOM = updateDOM;
MailList.prototype.getValues = getValues;
MailList.prototype.getUsers = getUsers;
MailList.prototype.remove = remove;
MailList.prototype.updateUsers = updateUsers;
MailList.prototype._getCurrentIds = _getCurrentIds;
/**
 * 标注插件版本号
 */
MailList.version = "1.2.0.hotfix.1";
