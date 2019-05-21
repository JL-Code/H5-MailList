import $ from '../../util'
import pickerTplArt from './picker.art'
import MailList from '../maillist'

function Picker(options) {
    const defaults = $.extend({
        id: 'default',
        className: '',
        container: 'body',
        onChange: $.noop,
        onConfirm: $.noop,
        onClose: $.noop
    }, options);

    let $picker = null;
    let maillist = null;

    // 显示与隐藏的方法
    function show() {
        // $picker = $($.render(pickerTpl, defaults));
        $picker = $(pickerTplArt(defaults));

        $(defaults.container).append($picker);

        // 这里获取一下计算后的样式，强制触发渲染. fix IOS10下闪现的问题
        $.getStyle($picker[0], 'transform');

        $picker.find('.weui-mask').addClass('weui-animate-fade-in');
        $picker.find('.weui-picker').addClass('weui-animate-slide-up');

        // 重新绑定事件
        bindEvents();
        let maillist = new MailList({ el: $picker.find('.weui-picker__bd'), url: "http://meunsc.oicp.net:47941/api/v2/organization_tree?userId=68D5333D-F106-4A45-9A5B-61589DA05FFD" });
        maillist.open();
        console.log(maillist)
    }

    function _hide(callback) {
        // _hide = $.noop; // 防止二次调用导致报错
        $picker.find('.weui-mask').addClass('weui-animate-fade-out');
        $picker.find('.weui-picker')
            .addClass('weui-animate-slide-down');
    }

    function hide(callback) {
        _hide(callback);
    }

    /**
     * @description 绑定事件
     */
    function bindEvents() {

        $picker
            .on('click', '.weui-mask', function () {
                hide();
            })
            .on('click', '.weui-picker__action', function () { hide(); })
            .on('click', '.weui-picker-confirm', function () {
                defaults.onConfirm();
            })
            .on('animationend webkitAnimationEnd', function (e) {
                if (e.target.classList.contains("weui-animate-slide-down")) {
                    $picker.remove();
                }
            });

    }

    this.open = show
}

export default Picker;