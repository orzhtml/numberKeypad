/*!
 * User: http://orzhtml.github.io/
 * Date: 17-01-23 上午17:15
 * Detail: 支付密码弹窗
 */

(function ($, window) {
    "use strict";
    // 默认配置
    var DEFAULTS = {
        random: false, // 是否随机摆放 0-9 数字
        zIndex: 1000, // 弹窗的层级，可根据不同页面配置
        ciphertext: true, // 是否显示明文，默认 true 密文*  | false 明文
        dot: true, // 是否显示小数点
        currency: false, // 是否是货币
        max: false, // 是否有输入的最大值，默认 false 没有，如果有，写入实际数值，必须大于0，例如：0.01 | 999999999999.99
        digits: 2, // 默认小数点保留最多2位，需要几位就写
        type: 'password', // password | number
        callback: '' // 回调
    };

    var isIos = navigator.userAgent.match(/iPhone|iPad|iPod/i);

    function numberKeypad(elem, args) {
        this.options = $.extend({}, DEFAULTS, args);

        this.isPassword = this.options.type === 'password';
        this.isNumber = this.options.type === 'number';
        this.isCurrency = this.options.currency;
        this.clickEvent = 'click';
        if (isIos) {
            this.clickEvent = 'touchstart';
        }
        // 选择模板
        this.$html = this.isNumber ? $(templateNumber()) : $(templatePwd());

        this.el = elem;
        this.init();
    };

    numberKeypad.prototype.constructor = numberKeypad;

    numberKeypad.prototype.init = function () {
        var _this = this;
        $('body').append(this.$html);

        // 绑定默认关闭按钮
        this.$html.find('[data-role="close"]').on('click', $.proxy(function () {
            this.close();
        }, this));

        this.$html.find('[data-role="ok"]').on('click', $.proxy(function () {
            var num = this.el.data('num');
            if (num) {
                if (this.isCurrency) {
                    this.el.val(addZero(num, 2));
                } else {
                    this.el.val(num);
                }
            } else {
                this.el.val('');
                num = '';
            }
            $('body').css('marginTop', '');
            this.options.callback && this.options.callback(this, num);
            this.close();
        }, this));

        // 点击遮罩层关闭
        this.$html.on('click', function (event) {
            if ($(event.target).parents('.ui-dialog-cnt').first().length) {
                return;
            }

            if (_this.isPassword) {
                _this.$html.find('[data-role="close"]').trigger('click');
            } else {
                _this.$html.find('.number-ok').trigger('click');
            }
        });

        // 显示弹窗
        this.$html.css('zIndex', this.options.zIndex).addClass('show');

        setTimeout($.proxy(function () {
            this.$html.addClass('show-visible');

            var top = this.el.offset().top + 50; // 避免刚好遮住部分输入框
            var mainHeight = this.$html.height();
            var cntHeight = this.$html.find('.ui-dialog-cnt').height();

            if (this.isNumber) {
                if (top >= (mainHeight - cntHeight)) {
                    $('body').addClass('numberBody').css('marginTop', -cntHeight);
                }
            }
        }, this), 0);

        if (this.isNumber) {
            this.el.val(this.el.data('num') || '');
        }

        // 其他事件
        this.num();
        this.add();
        this.del();
    };

    // 隐藏
    numberKeypad.prototype.close = function () {
        this.$html.removeClass("show-visible");
        setTimeout($.proxy(function () {
            this.$html.remove();
            $('body').removeClass('numberBody');
        }, this), 300);
    };

    // 渲染数字
    numberKeypad.prototype.num = function () {
        var $box = this.$html.find('.number-box');
        var arr = [];
        // 随机 0-9
        if (this.options.random && this.isPassword) {
            while (arr.length < 10) {
                //取 1-9 之间的整数
                var num = Math.floor(10 * Math.random());
                var flag = false;
                //遍历数组找到空位
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i] == num) {
                        flag = true;
                        break;
                    }
                }
                if (!flag) {
                    arr[arr.length] = num;
                }
            }
        } else {
            if (this.isNumber) {
                arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, (this.options.dot ? '.' : ''), 0];
            } else {
                arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
            }
        }
        // 渲染数字按钮
        $box.find('[data-trigger="key"]').each(function (i) {
            var $self = $(this);
            var val = arr[i] + '';
            if (val != '') {
                $self.data('key', arr[i]).html(val);
            } else {
                $self.addClass('bg-gray').html('&nbsp;');
            }
        });
    };

    // 点击数字
    numberKeypad.prototype.add = function () {
        var _this = this;

        if (this.isNumber) {
            this.$html.find('[data-trigger="key"]').on(this.clickEvent, function () {
                var $self = $(this);

                if ($self.hasClass('bg-gray')) {
                    return;
                }

                var key = $self.data('key');
                var _commaNum = '';
                // 你的回调代码
                var num = _this.el.data('num') || '';

                var numArr = num.split('.');

                if (num.indexOf('.') >= 0 && key == '.') {
                    return;
                }

                if (num.indexOf('.') >= 0 && numArr[1].length >= 2) {
                    return;
                }

                num += key;
                // 限制不能超过 max
                if (_this.options.max && num > _this.options.max) {
                    num = num.substring(0, num.length - 1);
                    $this.el.data('num', num);
                    $this.el.val(num);
                    return false;
                }
                _this.el.data('num', num);
                _this.el.val(num);
            });
        } else {
            var $password = this.$html.find('.password'); // 密码
            var $pwdVal = this.$html.find('.pwd-val'); // 密码显示文
            this.$html.find('[data-trigger="key"]').on(this.clickEvent, function () {
                var $self = $(this);
                var key = $self.data('key');
                var pwd = $password.val();
                // 超过 6 位不允许再录入
                if (pwd.length >= 6) {
                    return;
                } else {
                    pwd += key; // 追加输入的数字
                    if (_this.options.ciphertext) {
                        $pwdVal.eq(pwd.length - 1).text('*'); // 密文
                    } else {
                        $pwdVal.eq(pwd.length - 1).text(key); // 明文
                    }
                    $password.val(pwd); // 填入隐藏域
                }

                // 输入够6位数后立即执行需要做的事情，比如ajax提交
                if (pwd.length === 6) {
                    // 你的回调代码
                    _this.options.callback && _this.options.callback(_this, pwd);
                }
            });
        }
    };

    // 从右边开始删除密码
    numberKeypad.prototype.del = function () {
        var _this = this;

        if (this.isNumber) {
            this.$html.find('.number-delete').on(this.clickEvent, function () {
                var num = _this.el.data('num');
                //  数字为空的时候不在执行
                if (num !== '') {
                    num = num.slice(0, -1); // 从最右边开始截取 1 位字符
                    _this.el.data('num', num); // 赋值给文本框同步
                    _this.el.val(num);
                }
            });
        } else {
            var $password = this.$html.find('.password'); // 密码
            var $pwdVal = this.$html.find('.pwd-val'); // 密码显示文
            this.$html.find('.number-delete').on(this.clickEvent, function () {
                var pwd = $password.val();
                // 密码为空的时候不在执行
                if (pwd !== '') {
                    pwd = pwd.slice(0, -1); // 从最右边开始截取 1 位字符
                    $password.val(pwd); // 赋值给密码框同步密码
                    $pwdVal.eq(pwd.length).text(''); // 密码明文显示从右开始清空文本
                }
            });
        }
    };

    function addZero(num, digits) {
        if (num === "" || num === "undefined" || num === null || num === undefined || num === "null") {
            num = 0;
        }
        if (digits === "" || digits === "undefined" || digits === null || digits === undefined || digits === "null") {
            digits = 2;
        }

        var floatNum = parseFloat(num);

        if (isNaN(floatNum) || floatNum == 0) {
            return digits == "0" ? "0" : "0.00";
        } else {
            if (digits == 0 && floatNum < 1) {
                return "0";
            } else {
                return setComma(parseFloat(num).toFixed(digits));
            }
        }
    }

    function setComma(num) {
        var _num = num + "";

        if (_num != "") {
            var regx = new RegExp(/(-?\d+)(\d{3})/);
            var bExists = _num.indexOf(".", 0);
            var strArr = _num.split('.');

            while (regx.test(strArr[0])) {
                strArr[0] = strArr[0].replace(regx, "$1,$2");
            }

            if (bExists > -1) {
                return strArr[0] + "." + strArr[1];
            } else {
                return strArr[0];
            }

        } else {
            return "";
        }
    }

    // 密码键盘模板
    function templatePwd() {
        return _TEXT(function () {
            /*
            <div id="NumberKeypad" class="ui-dialog ui-dialog-actions number-keypad">
	            	<div class="ui-dialog-cnt">
	            		<div class="ui-dialog-hd">
	            			<a class="icon icon-close" data-role="close"></a>
	            			<div class="title">Payment Password</div>
	            		</div>
	            		<div class="ui-dialog-bd">
	            			<input type="password" class="password">
	            			<div class="pwd-box">
	            				<div class="pwd-val"></div>
	            				<div class="pwd-val"></div>
	            				<div class="pwd-val"></div>
	            				<div class="pwd-val"></div>
	            				<div class="pwd-val"></div>
	            				<div class="pwd-val"></div>
	            			</div>
	            			<div class="number-box ui-border-t">
		            			<div class="ui-flex ui-border-b">
			            			<a class="ui-flex-item ui-border-r" data-trigger="key"></a>
			            			<a class="ui-flex-item ui-border-r" data-trigger="key"></a>
			            			<a class="ui-flex-item ui-border-r" data-trigger="key"></a>
		            			</div>
		            			<div class="ui-flex ui-border-b">
			            			<a class="ui-flex-item ui-border-r" data-trigger="key"></a>
			            			<a class="ui-flex-item ui-border-r" data-trigger="key"></a>
			            			<a class="ui-flex-item ui-border-r" data-trigger="key"></a>
		            			</div>
		            			<div class="ui-flex ui-border-b">
			            			<a class="ui-flex-item ui-border-r" data-trigger="key"></a>
			            			<a class="ui-flex-item ui-border-r" data-trigger="key"></a>
			            			<a class="ui-flex-item ui-border-r" data-trigger="key"></a>
		            			</div>
	            				<div class="ui-flex ui-border-b">
	            					<a class="ui-flex-item ui-border-r bg-gray">&nbsp;</a>
	            					<a class="ui-flex-item ui-border-r" data-trigger="key"></a>
	            					<a class="ui-flex-item ui-border-r number-delete"><i class="icon icon-delete"></i></a>
	            				</div>
	            			</div>
	            		</div>
	            	</div>
            </div>
            */
        });
    }

    //  数字键盘模板
    function templateNumber() {
        return _TEXT(function () {
            /*
            <div id="NumberKeypad" class="ui-dialog ui-dialog-actions number-keypad">
	            	<div class="ui-dialog-cnt">
	            		<div class="ui-dialog-bd number-bar">
	            			<div class="number-box ui-border-t">
	            				<div class="ui-flex ui-border-b">
			            			<a class="ui-flex-item ui-border-r" data-trigger="key"></a>
			            			<a class="ui-flex-item ui-border-r" data-trigger="key"></a>
			            			<a class="ui-flex-item ui-border-r" data-trigger="key"></a>
		            			</div>
		            			<div class="ui-flex ui-border-b">
			            			<a class="ui-flex-item ui-border-r" data-trigger="key"></a>
			            			<a class="ui-flex-item ui-border-r" data-trigger="key"></a>
			            			<a class="ui-flex-item ui-border-r" data-trigger="key"></a>
		            			</div>
		            			<div class="ui-flex ui-border-b">
			            			<a class="ui-flex-item ui-border-r" data-trigger="key"></a>
			            			<a class="ui-flex-item ui-border-r" data-trigger="key"></a>
			            			<a class="ui-flex-item ui-border-r" data-trigger="key"></a>
		            			</div>
	            				<div class="ui-flex ui-border-b">
	            					<a class="ui-flex-item ui-border-r" data-trigger="key"></a>
	            					<a class="ui-flex-item ui-border-r" data-trigger="key"></a>
	            					<a class="ui-flex-item ui-border-r number-hide" data-role="ok"><i class="icon icon-hide"></i></a>
	            				</div>
	            			</div>
	            			<div class="fun-box ui-border-t">
	            				<div class="ui-border-b">
	            					<a class="ui-border-l number-delete"></a>
	            					<a class="ui-border-l number-ok" data-role="ok"><span>确定</span></a>
	            				</div>
	            			</div>
	            		</div>
	            	</div>
            </div>
            */
        });
    }
    // 输出模板字符串
    function _TEXT(wrap) {
        return wrap.toString().match(/\/\*\s([\s\S]*)\s\*\//)[1];
    };

    $.fn.NumberKeypad = function (args) {
        return this.each(function () {
            var el = this;
            var plugins = new numberKeypad($(el), args);
            $(el).data("NumberKeypad", plugins);
        });
    };
})(jQuery, window);