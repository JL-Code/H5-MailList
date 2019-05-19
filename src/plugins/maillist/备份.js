
/**
 * @description 递归遍历查找指定ID的节点
 * @param {String} id
 * @param {Object} data 数据源
 */
function find(id, data) {
  let value;
  let source = {};
  if (Array.isArray(data)) {
    source.children = data;
  } else {
    source = data;
  }
  recursiveTraverse(source, function(node) {
    console.log("node", node);
    console.log("id", id);
    if (node.id === id) {
      value = node;
      return false;
    }
  });
  return value;
}
/**
 * @description 渲染函数 维护一个订阅者对象 提供一个notify 方法通知订阅者更新
 * @param {Object} node
 */
function render(node) {
  console.log("render", node);
  console.log("render", node.children);
  let html = maillistTpl(node);
  document.getElementById("content").innerHTML = html;
  // 更新面包屑导航
  let crumb = {
    id: node.id,
    text: node.text,
    active: true
  };
  // 默认不存在该元素
  let exists = false;
  let existsIndex = -1;
  crumbs.forEach((c, index) => {
    c.active = false;
    if (c.id === crumb.id) {
      c.active = true;
      exists = true;
      existsIndex = index;
    }
  });
  if (!exists) {
    crumbs.push(crumb);
  }

  if (existsIndex > -1) {
    // 移除该元素后所有元素
    crumbs.splice(existsIndex + 1);
  }
  // 渲染面包屑导航
  renderCrumb(crumbs);
}
/**
 * @description 渲染导航
 */
function renderNav(data) {
  console.log("renderCrumb", data);
  let el = document.getElementById("crumb");
  let html = crumbTpl(data);
  el.innerHTML = html;
}

/**
 * @description 绑定事件
 */
function bindEvents() {
  // 下级菜单点击事件
  $("#content").on("click", ".weui-check__label .submenu", function(e) {
    // console.log("点击了", e.target.tagName);
    let dataset = e.target.dataset;
    // 阻止事件冒泡
    e.stopPropagation();
    // 阻止事件的默认行为
    e.preventDefault();
    // 重新渲染数据展示区域
    let node = JSON.parse(dataset.node);
    render(node);
  });
  // input 勾选事件
  $("#content").on("change", "input[type=checkbox]", function(e) {
    console.log("changed", e.target.tagName, e.target.checked);
  });
  // 面包屑导航点击事件
  $("#crumb").on("click", ".nav__item", function(e) {
    // console.log(e.target.dataset);
    // console.log(e.target.tagName);
    let dataset = e.target.dataset;
    if (dataset.id) {
      let node = find(dataset.id, data);
      console.log("找到了node", node);
      // 重新渲染数据展示区域
      if (node) render(node);
    }
  });
}

/**
 * @description 递归遍历函数
 * @param {Object} node 树节点
 * @param {Function} action 函数
 */
function recursiveTraverse(node, action) {
  // 递归出口1
  if (!node || !node.children) {
    console.log("recursiveTraverse end node or node.length valid");
    return;
  }
  let flag = action(node);
  // 递归出口2
  if (flag === false) {
    return;
  }
  node.children.forEach(function(item, index) {
    recursiveTraverse(item, action);
  });
}