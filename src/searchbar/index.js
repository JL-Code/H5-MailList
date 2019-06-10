/*
 * @Description:
 * @Author: jiangy
 * @Date: 2019-05-21 20:49:02
 */
import _ from "lodash";
import axios from "../plugins/axios";
import barTpl from "./input";
import resultTpl from "./result-list.art";

const nullData =
  '<div class="weui-loadmore weui-loadmore_line">\n' +
  '            <span class="weui-loadmore__tips">暂无数据</span>\n' +
  "        </div>";
const loading =
  '<div class="weui-loadmore">\n' +
  '            <i class="weui-loading"></i>\n' +
  '            <span class="weui-loadmore__tips">正在加载</span>\n' +
  "        </div>";

/**
 * @description 搜索框
 * @param options {id:'',resultId:''} | id string
 * @constructor
 */
function SearchBar(options) {
  if (typeof options === "string") {
    options = { id: options, resultId: options + "_result" };
  }
  let defaults = {
    id: ""
  };
  let opts = _.merge(defaults, options);
  this.options = opts;
  this.render();
  this.bindEvents();
}

/**
 * @description 渲染
 */
function render() {
  let opts = this.options;
  let searchbar = barTpl(opts);
  let resultId = opts.id + "_reuslt";
  let resultHtml = '<div id="' + resultId + '" class="searchbar-result"></div>';
  this.$bar = $("#" + opts.id);
  this.$bar.html(searchbar);
  this.$bar.append(resultHtml);
  this.$result = $("#" + resultId);
  this.$text = this.$bar.find(".weui-search-bar__label");
  this.$input = this.$bar.find(".weui-search-bar__input");
  this.$clear = this.$bar.find(".weui-icon-clear");
  this.$cancel = this.$bar.find(".weui-search-bar__cancel-btn");
}

function bindEvents() {
  let _this = this;
  let opts = _this.options;
  this.$input
    .on(
      "input",
      _.debounce(function(event) {
        console.log("input", this.value);
        if (this.value.length) {
          _this.$result.show();
          _this.$result.html(loading);
          _this.search(this.value);
        } else {
          _this.$result.html(nullData);
          _this.$result.hide();
        }
      }, 200)
    )
    .on("focus", function(e) {
      console.log("focus", e.target);
    });
  // 清空
  this.$clear.on("click", function() {
    _this.$result.html(nullData);
    _this.$result.hide();
  });
  // 取消
  this.$cancel.on("click", function() {
    _this.$result.html(nullData);
    _this.$result.hide();
  });
  //启用weui searchbar
  weui["searchBar"]("#" + opts.id);
}

/**
 * @description 发送POST请求
 * @param url
 */
function search(keyword, url = "/api/v2/organization_tree/users_search") {
  let _this = this;
  //TODO: orgGUID 临时 12E00E3A-97C3-E711-8107-A4C858FD94E6 西南区域公司
  axios
    .post(url, null, {
      timeout: 4500,
      params: {
        orgGUID: "12E00E3A-97C3-E711-8107-A4C858FD94E6",
        keyword: keyword
      }
    })
    .then(({ data }) => {
      if (data.ErrCode !== 0) {
        _this.$result.html(nullData);
        return;
      }
      if (data.Result.length) {
        let html = resultTpl(data.Result);
        _this.$result.html(html);
      } else {
        _this.$result.html(nullData);
      }
    })
    .catch(err => {
      console.log(err);
      _this.$result.html(nullData);
    });
}

SearchBar.prototype.render = render;
SearchBar.prototype.bindEvents = bindEvents;
SearchBar.prototype.search = search;

export default SearchBar;
