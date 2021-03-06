/*
 * @Description: MailList组件的子组件 负责实现搜索功能。
 * @Author: jiangy
 * @Date: 2019-05-21 20:49:02
 * @Version 1.1.0
 */

import icons from "../../../assets/base64";
import axios from "../../../plugins/axios";
import inputTpl from "./input.art";
import resultTpl from "./result-list.art";
const debounce = require("lodash.debounce");

const nullData =
  '<div class="weui-loadmore weui-loadmore_line">\n' +
  '            <span class="weui-loadmore__tips">暂无数据</span>\n' +
  "        </div>";
const loadingHtml =
  '<div class="weui-loadmore">\n' +
  '            <i class="weui-loading"></i>\n' +
  '            <span class="weui-loadmore__tips">正在加载</span>\n' +
  "        </div>";

export class SearchBar {
  constructor(options, eventbus) {
    this._eventbus = eventbus;
    this.options = Object.assign({ method: "get" }, options);
    // 远程检索到的数据
    this.searchResultData = [];
    this.render();
  }

  static create(options) {
    return new SearchBar(options);
  }

  /**
   * @description DOM渲染函数
   */
  render() {
    // TODO: 暂不考虑批量组件
    const $el = $(this.options.el);
    const inputHtml = inputTpl({});
    $el.append(inputHtml);
    this.$el = $el;
    // 调用事件绑定函数
    this.bindEvents();
  }

  /**
   * @description DOM元素绑定事件
   */
  bindEvents() {
    const _this = this;
    const $searchBar = _this.$el;
    const $searchResult = $searchBar.find(".searchbar-result");
    // const $searchResult = $(popupTpl({}));

    const $actionbar = $searchBar.find(".search-bottom-actionbar");
    const $searchLabel = $searchBar.find(".weui-search-bar__label");
    const $searchInput = $searchBar.find(".weui-search-bar__input");
    const $searchClear = $searchBar.find(".weui-icon-clear");
    const $searchCancel = $searchBar.find(".weui-search-bar__cancel-btn");
    this.$searchResult = $searchResult;
    this.$actionbar = $actionbar;
    // 清空输入框
    function cancelSearch() {
      $searchInput.val("");
      $actionbar.hide();
      $searchResult.html(nullData);
    }

    $searchLabel.on("click", function() {
      $searchBar.addClass("weui-search-bar_focusing searchbar_fixed");
      $searchInput[0].focus();
    });

    $searchInput
      .on("blur", function() {
        if (!this.value.length) cancelSearch();
      })
      .on(
        "input",
        debounce(function(event) {
          if (this.value.length) {
            $searchResult.html(loadingHtml);
            // 发送 search 事件，父级组件负责监听。
            _this._eventbus.fire("search", this.value);
          } else {
            $searchResult.html(nullData);
          }
        }, 200)
      );

    $searchClear.on("click", function() {
      cancelSearch();
      $searchInput[0].focus();
    });
    // 取消搜索
    $searchCancel.on("click", function() {
      cancelSearch();
      $searchBar.removeClass("weui-search-bar_focusing searchbar_fixed");
      $searchInput[0].blur();
    });
    // TODO: 未做是否勾选验证
    $searchBar.on("click", ".bottom-actionbar__action", function(e) {
      cancelSearch();
      $searchBar.removeClass("weui-search-bar_focusing searchbar_fixed");
      $searchInput[0].blur();
    });
  }

  /**
   * @description 搜索函数
   * @param params {Object} 参数
   * @param values {Array} 选中的用户ID集合
   */
  search(params = {}, values = []) {
    let opts = this.options;
    let config = {
      url: opts.url,
      method: opts.method,
      ...params
    };
    axios(config)
      .then(({ data }) => {
        if (data.ErrCode !== 0) return Promise.reject(data);
        this.loadData(data, values);
      })
      .catch(err => {
        this.loadError(err);
      });
  }

  /**
   * @description 加载数据
   */
  loadData(data, checkeds) {
    // TODO: 暂时不实现checkeds功能
    checkeds = [];
    try {
      if (this.options.mode === "multi") {
        for (const item of data.Result) {
          item.checked = checkeds.indexOf(item.ID) > -1;
        }
      }
      this.searchResultData = data.Result;
      if (this.searchResultData.length) {
        let data = {
          mode: this.options.mode,
          result: this.searchResultData,
          icons
        };
        let html = resultTpl(data);
        this.$searchResult.html(html);
        this.$actionbar.show();
      } else {
        this.$searchResult.html(nullData);
      }
    } catch (e) {
      console.error(e.message);
    }
  }

  loadError(err) {
    this.$searchResult.html(nullData);
  }
}
