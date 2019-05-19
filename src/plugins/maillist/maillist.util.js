/**
 * @description 递归遍历查找指定ID的节点
 * @param {String} id
 * @param {Object} data 数据源
 */
export function findNode(id, data) {
  let value;
  let source = {};
  if (Array.isArray(data)) {
    source.Children = data;
  } else {
    source = data;
  }
  let label = "递归遍历查找耗时：";
  console.time(label);
  recursiveTraverse(source, function(node) {
    console.debug("node", node);
    console.debug("id", id);
    if (node.ID === id) {
      value = node;
      return false;
    }
  });
  console.timeEnd(label);
  return value;
}

/**
 * @description 递归遍历函数
 * @param {Object} node 树节点
 * @param {Function} action 函数
 */
export function recursiveTraverse(node, action) {
  // 递归出口1
  if (!node || !node.Children) {
    console.debug("recursiveTraverse end node or node.length valid");
    return;
  }
  let flag = action(node);
  // 递归出口2
  if (flag === false) {
    return;
  }
  node.Children.forEach(function(item, index) {
    recursiveTraverse(item, action);
  });
}
