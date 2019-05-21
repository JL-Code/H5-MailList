/**
 * Created with webpack.example.
 * User: Liu
 * Date: 2018/1/20
 * Time: 15:38
 */
import _ from 'lodash'
import weui from 'weui.js'
import searchBarTemplate from './template/searchbar.art'
import searchResultTemplate from './template/searchresult.art'

"use strict";

const nullData = '<div class="weui-loadmore weui-loadmore_line">\n' +
    '            <span class="weui-loadmore__tips">暂无数据</span>\n' +
    '        </div>';
const loading = '<div class="weui-loadmore">\n' +
    '            <i class="weui-loading"></i>\n' +
    '            <span class="weui-loadmore__tips">正在加载</span>\n' +
    '        </div>';

/**
 * @description 搜索框
 * @param options {id:'',resultId:''} | id string
 * @constructor
 */
function SearchBar(options) {
    if (typeof options === 'string') {
        options = {id: options, resultId: options + '_result'};
    }
    let defaults = {
        id: ''
    };
    let opts = _.assign(defaults, options);
    this.options = opts;
    this.render();
    this.bind();
}

function render() {

    let opts = this.options;
    let searchbar = searchBarTemplate(opts);
    let resultId = opts.id + '_reuslt';
    let resultHtml = '<div id="' + resultId + '" class="app-content searchbar-result" style="display: none;"></div>';
    this.$bar = $('#' + opts.id);
    this.$bar.html(searchbar);
    this.$bar.after(resultHtml);
    this.$result = $('#' + resultId);
    this.$text = this.$bar.find('.weui-search-bar__label');
    this.$input = this.$bar.find('.weui-search-bar__input');
    this.$clear = this.$bar.find('.weui-icon-clear');
    this.$cancel = this.$bar.find('.weui-search-bar__cancel-btn');
}

function bind() {
    let _this = this;
    let opts = _this.options;
    this.$input.on('input', _.debounce(function (event) {
        console.log(this.value);
        if (this.value.length) {
            _this.$result.show();
            _this.$result.html(loading);
            _this.search(this.value);
        }
        else {
            _this.$result.html(nullData);
            _this.$result.hide();
        }
    }, 200));
    this.$clear.on('click', function () {
        _this.$result.html(nullData);
        _this.$result.hide();
    });
    this.$cancel.on('click', function () {
        _this.$result.html(nullData);
        _this.$result.hide();
    });
    //启用weui searchbar
    weui['searchBar']('#' + opts.id);
    //默认获取搜索框焦点
    setTimeout(() => {
        _this.$input.focus();
    }, 200)
}

/**
 * @description 发送POST请求
 * @param url
 */
function search(keyword) {
    let _this = this;
    let url = "../app/searchasync";
    $axios.post(url, {type: _this.options.type, keyword: keyword}, {timeout: 4500})
        .then(response => {
            let data = response.data || {Count: 0, Items: [], Type: 0};
            if (data.Count) {
                let html = searchResultTemplate(data);
                _this.$result.html(html);
            }
            else {
                _this.$result.html(nullData);
            }
        })
        .catch(err => {
            console.log(err);
            _this.$result.html(nullData);
        });
}

SearchBar.prototype.render = render;
SearchBar.prototype.bind = bind;
SearchBar.prototype.search = search;

export default SearchBar;