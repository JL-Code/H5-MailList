"use strict";

import axios from "../plugins/axios";
import { findNode } from "./maillist.util";
import icons from "../assets/base64";
import Picker from "../picker";
import SearchBar from "../searchbar";

import mailListTpl from "./templates/maillist";
import maillistResultTpl from "./templates/maillist-result";
import linkmanAvatarTpl from "./templates/linkman-avatar";

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
  // TODO: 挂载元素 考虑取消挂载在实例上，而采用私有变量
  // 配置参数
  this.options = $.extend(
    {
      // 挂载元素
      el: "",
      mode: "multi",
      type: ["user"],
      label: "联系人",
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
    activeUsers: new Map(),
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
    console.log("render data", data);
    console.log("getValues", this.getValues());
    // TODO: 待优化数据结构和更新机制
    let source = {
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
    console.log("source", source);
    // TODO: 临时解决切换nav DOM更新导致input 的勾选状态消失问题。
    for (const user of source.Users) {
      user.checked = false;
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
    this.updateDOM("count");
    let html = mailListTpl(source);
    this.picker.$picker.find(".weui-picker__bd").html(html);
    // 在MailList html 加入 DOM 树后初始 searchbar
    this.searchbar = new SearchBar("searchbar");
  };

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
      fetchUser(_this.options.url, dataset.id)
        .then(res => {
          loading.hide();
          if (res.data.ErrCode !== 0) {
            return Promise.reject(res.data);
          }
          let users = res.data.Result;
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
      updateView.call(_this, e.target);
    });
  // 事件注册
  this.picker.$picker
    .off("chagne", "input[type=checkbox]")
    .on("change", "input[type=checkbox]", onChanged);

  // 订阅了用户勾选改变事件
  function onChanged(e) {
    let target = e.target;
    let dataset = target.dataset;
    // 用户的操作都在activeUsers中
    let activeUsers = _this.users.activeUsers;
    // Map 重复set 会覆盖上一次value
    // TODO: 需要考虑解决关闭重新打开组件带值重入，CheckBox 勾选问题。
    if (target.checked) {
      let user = JSON.parse(dataset.user);
      user.checked = target.checked;
      activeUsers.set(dataset.id, user);
    } else {
      activeUsers.delete(dataset.id);
    }
    // 派发更新
    _this.updateDOM("count");
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
    // text: `${node.Name}(${node.Users.length})`,
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
// 更新用户列表DOM
function updateView(target, users = []) {
  let dataset = target.dataset;
  let node = findNode(dataset.id, this.data);
  console.log("updateView", users);
  console.log("node", node);
  if (node) {
    node.Users = node.Users && node.Users.length ? node.Users : users;
    console.log("node.Users", node.Users);
    console.log("node.active", this.users.activeUsers);

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
  return axios.post(url);
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
  let $box = $(maillistResultTpl({ label: this.options.label, Users: [] }));
  // $(this.options.el).addClass("maillist");
  $(this.options.el).append($box);

  $box
    .on("click", ".maillist-action_add", function(e) {
      // console.log("_this", _this.open);
      _this.open();
    })
    .on("click", ".maillist-action_close", function(e) {
      console.log(e.target);
      let dataset = e.target.dataset;
      _this.remove(dataset.id);
    });
}

// 从远程获取数据（在open后请求数据，且在生命周期内只请求一次）
function request() {
  let url = this.options.url;
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
  this.users.activeUsers.forEach((value, key) => {
    this.users.lazyUsers.set(key, value);
  });
  this.users.activeUsers.clear();
}

// 移除选中的值
function remove(id) {
  this.users.lazyUsers.delete(id);
  // 更新box-item
  this.updateDOM("box-item");
}

// 获取选中的值
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
 * @description 打开通讯录选择界面
 */
function open() {
  let _this = this;
  // 打开picker
  let picker = new Picker({
    className: this.options.className,
    onClose: function() {
      _this.users.activeUsers.clear();
    },
    onConfirm: function() {
      _this.updateUsers();
      _this.updateDOM("box-item");
      _this.options.onConfirm(_this.getValues());
    }
  });
  picker.open();
  //TODO: 赋值Picker、SearchBar
  this.picker = picker;
  bindEvents.call(this);
  this.request();
}

// 加载数据
function loadData(data) {
  this.data = data;
  // TODO: 临时解决带值打开组件重入问题
  // let selected = this.options.selectedUserIds;
  // this.users.lazyUsers.set()
  this.render(data);
}

// =============================DOM操作=================================
/**
 * @description 更新DOM树
 */
function updateDOM(type) {
  console.log("dom type", type);
  let html = "";
  switch (type) {
    case "count":
      let count = this.users.lazyUsers.size + this.users.activeUsers.size;
      // let html = `已选择:${count}人`;
      html = count ? `( ${count} ) 确定` : "确定";
      this.picker.$picker.find(".weui-picker-confirm").html(html);
      break;
    case "box-item":
      // TODO: 更新box显示结果
      html = linkmanAvatarTpl({ Users: this.getValues() });
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
 *
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

export default MailList;
