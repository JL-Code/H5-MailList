import EventBus from "../../event-bus";
import pickerTplArt from "./picker.art";

function Picker(options) {
  const defaults = $.extend(
    {
      className: "",
      container: "body",
      onConfirm: $.noop,
      onClose: $.noop,
      onBeforeClose: $.noop
    },
    options
  );

  let $picker = null;

  // 显示与隐藏的方法
  function show() {
    const _this = this;
    $picker = $(pickerTplArt(defaults));

    $(defaults.container).append($picker);

    // 这里获取一下计算后的样式，强制触发渲染. fix IOS10下闪现的问题
    getStyle($picker[0], "transform");

    $picker.find(".weui-mask").addClass("weui-animate-fade-in");
    $picker.find(".weui-picker").addClass("weui-animate-slide-up");
    this.$picker = $picker;
    // 重新绑定事件
    bindEvents.call(this);
    // // 创建通讯录组件
    // let maillist = new MailList({
    //   el: $picker.find(".weui-picker__bd"),
    //   url:
    //     "http://meunsc.oicp.net:47941/api/v2/organization_tree?userId=68D5333D-F106-4A45-9A5B-61589DA05FFD",
    //   onConfirm: function(data) {
    //     _this.hide();
    //     defaults.onConfirm(data);
    //   }
    // });
    // maillist.open();
  }

  function _hide(callback) {
    // _hide = $.noop; // 防止二次调用导致报错
    $picker.find(".weui-mask").addClass("weui-animate-fade-out");
    $picker.find(".weui-picker").addClass("weui-animate-slide-down");
  }

  function hide(callback) {
    _hide(callback);
    // 解除 _confirm 事件监听
    EventBus.off("_confirm");
  }

  /**
   * @description 绑定事件
   */
  function bindEvents() {
    let _this = this;
    $picker
      .on("click", ".weui-mask", function() {
        hide();
      })
      //   .on("click", ".weui-picker__action", function() {
      //     if (defaults.onBeforeClose && defaults.onBeforeClose() === false) {
      //     } else {
      //       hide();
      //     }
      //   })
      .on("click", ".weui-picker-cancel", function() {
        if (defaults.onBeforeClose() !== false) {
          defaults.onClose();
          hide();
        }
      })
      .on("click", ".weui-picker-confirm", function() {
        defaults.onConfirm();
        hide();
      })
      .on("animationend webkitAnimationEnd", function(e) {
        if (e.target.classList.contains("weui-animate-slide-down")) {
          _this.$picker = null;
          $picker.remove();
        }
      });
  }

  function getStyle(el, styleProp) {
    var value,
      defaultView = (el.ownerDocument || document).defaultView;
    // W3C standard way:
    if (defaultView && defaultView.getComputedStyle) {
      // sanitize property name to css notation
      // (hypen separated words eg. font-Size)
      styleProp = styleProp.replace(/([A-Z])/g, "-$1").toLowerCase();
      return defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
    } else if (el.currentStyle) {
      // IE
      // sanitize property name to camelCase
      styleProp = styleProp.replace(/\-(\w)/g, (str, letter) => {
        return letter.toUpperCase();
      });
      value = el.currentStyle[styleProp];
      // convert other units to pixels on IE
      if (/^\d+(em|pt|%|ex)?$/i.test(value)) {
        return (value => {
          var oldLeft = el.style.left,
            oldRsLeft = el.runtimeStyle.left;
          el.runtimeStyle.left = el.currentStyle.left;
          el.style.left = value || 0;
          value = el.style.pixelLeft + "px";
          el.style.left = oldLeft;
          el.runtimeStyle.left = oldRsLeft;
          return value;
        })(value);
      }
      return value;
    }
  }

  // TODO: 监听close 事件
  EventBus.on("_confirm", function(mode) {
    console.log("EventBus");
    console.log(EventBus);
    if (mode === "single") {
      defaults.onConfirm();
      hide();
    }
  });

  this.open = show;
  this.hide = hide;
}

export default Picker;
