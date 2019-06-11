/*
 * @Description: MailList组件的子组件 负责实现搜索功能。
 * @Author: jiangy
 * @Date: 2019-05-21 20:49:02
 * @Version 1.1.0
 */
import _ from "lodash";
import EventBus from "../../event-bus";
import icons from "../../../assets/base64";
import axios from "../../../plugins/axios";
import inputTpl from "./input.art";
import resultTpl from "./result-list.art";

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
  constructor(selector) {
    this.selector = selector;
    // 远程检索到的数据
    this.searchResultData = [];

    this.render();
  }

  static create(selector) {
    return new SearchBar(selector);
  }

  /**
   * @description DOM渲染函数
   */
  render() {
    // TODO: 暂不考虑批量组件
    const $el = $(this.selector);
    const inputHtml = inputTpl({});
    console.log("inputHtml", inputHtml);
    console.log(" $el", $el);
    $el.append(inputHtml);
    this.$el = $el;
    // 调用事件绑定函数
    this.bindEvents();
  }

  /**
   * @description DOM元素绑定事件
   */
  bindEvents() {
    console.debug("bindEvents", Date.now());
    const _this = this;
    const $searchBar = _this.$el;
    const $searchResult = $searchBar.find(".searchbar-result");
    const $searchLabel = $searchBar.find(".weui-search-bar__label");
    const $searchInput = $searchBar.find(".weui-search-bar__input");
    const $searchClear = $searchBar.find(".weui-icon-clear");
    const $searchCancel = $searchBar.find(".weui-search-bar__cancel-btn");
    this.$searchResult = $searchResult;
    // 清空输入框
    function cancelSearch() {
      $searchInput.val("");
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
        _.debounce(function(event) {
          if (this.value.length) {
            $searchResult.html(loadingHtml);
            // 发送 search 事件，父级组件负责监听。
            EventBus.fire("search", this.value);
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
    $searchResult.on("click", ".bottom-actionbar__action", function(e) {
      cancelSearch();
      $searchBar.removeClass("weui-search-bar_focusing searchbar_fixed");
      $searchInput[0].blur();
    });
    // $searchResult.on("click", "input[type=checkbox].search-check", function(
    //   e
    // ) {});
  }

  /**
   * @description 搜索函数
   */
  search(keyword, options = { url: "/api/v2/organization_tree/users_search" }) {
    axios
      .post(options.url, null, {
        timeout: 5000,
        params: {
          orgGUID: "EAB884B7-E9EC-4825-99DA-4E93C2C76213",
          keyword: keyword
        }
      })
      .then(({ data }) => {
        if (data.ErrCode !== 0) return Promise.reject(data);
        this.loadData(data);
      })
      .catch(err => {
        this.loadError(err);
      });
  }

  /**
   * @description 加载数据
   */
  loadData(data) {
    this.searchResultData = data.Result;
    if (data.Result.length) {
      let html = resultTpl({
        result: this.searchResultData,
        selectdCount: 0,
        icons
      });
      this.$searchResult.html(html);
    } else {
      this.$searchResult.html(nullData);
    }
  }
  loadError(err) {
    this.$searchResult.html(nullData);
  }
}
