function Kalok(options) {
    this.views = {};
    this.user_list = options.user_list || [];
    this.things = options.things || [];
    this.templateLoader = new this.TemplateLoader();
}

Kalok.prototype.getThingByID = function (id) {
    return _.find(this.things, function (thing) {
        return id == thing.id;
    });
};

Kalok.prototype.getLuckMan = function () {
    var end = this.user_list.length;

    //整一个随机数呗~
    var luck_num = Math.floor(Math.random() * end);
    console.log(luck_num);

    if (this.user_list[luck_num].choosed) {
        return this.getLuckMan();
    } else {
        this.user_list[luck_num].choosed = true;
        //幸运猪角就是你了~
        return this.user_list[luck_num];
    }
};

Kalok.prototype.TemplateLoader = function () {

    this.templates = {};

    this.load = function (names, callback) {
        var deferreds = [];
        var self = this;

        $.each(names, function (index, name) {
            deferreds.push(
                $.get('tpls/' + name + '.html', function (data) {
                    self.templates[name] = _.template(data);
                }, "text")
            );
        });

        $.when.apply(null, deferreds).done(callback);
    };

    // Get template by name from hash of preloaded templates
    this.get = function (name) {
        return this.templates[name];
    };
};

var kalok = new Kalok({ user_list: window.user_list, things: window.things });

kalok.Router = Backbone.Router.extend({
    initialize: function () {

    },
    routes: {
        "": "index",
        "thing/:id": "thing"
    },
    index: function () {
        //清一下缓存
        localStorage.clear();
        location.href = "#/thing/1";
    },
    thing: function (id) {
        window.currentThingId = parseInt(id);

        //切换一个界面，换奖品，换数量
        var thing = kalok.getThingByID(id);
        var view = new kalok.views.Thing({ thing: thing });

        //切换
        this.slide(view);
    },
    slide: function (view) {
        $('.box').html(view.$el);
    }
});

kalok.views.Thing = Backbone.View.extend({
    status: 'stop',
    events: {
        'click .luckman': 'changeLuckman'
    },
    initialize: function (options) {
        _.bindAll(this, 'keyup', 'left', 'right', 'space', 'changeLuckman');

        this.bind("reset", this.remove);
        this.template = kalok.templateLoader.get('thing');
        this.thing = options.thing;
        this.luckman = [];
        $(document).on('keyup', this.keyup);

        this.render();

        //从localStorage里取
        var ll = localStorage.getItem(this.thing.id);
        if (ll) {
            this.luckman = JSON.parse(ll);
            this.status = "stop";
            this.showLuckman(0);
        }
    },
    keyup: function () {
        if (event.keyCode === 32) {
            this.space();
        } else if (event.keyCode === 37) {
            this.left();
        } else if (event.keyCode === 39) {
            this.right();
        }
    },
    left: function () {
        console.log('key left');
        if (window.currentThingId > 1) {
            this.remove();
            location.href = "#/thing/" + (window.currentThingId - 1);
        } else {
            alert('这是第一个奖品哦！');
        }
    },
    right: function () {
        console.log('key right');
        if (window.currentThingId < window.things.length) {
            this.remove();
            location.href = "#/thing/" + (window.currentThingId + 1);
        } else {
            alert('木有奖品啦~');
        }
    },
    space: function () {
        console.log('space');
        if (this.status == "start") {
            this.stop();
            this.status = 'stop';
        } else {
            if (this.luckman.length > 0) {
                alert('已经抽过啦');
            } else {
                this.status = 'start';
                console.log('现在开始');
                this.start();
            }
        }
    },
    render: function () {
        this.$el.html(this.template(this.thing));
    },
    start: function () {
        //GIF动画上场
        this.$el.find('.gift__user-loading').css('display', 'block');
    },
    stop: function () {
        this.$el.find('.gift__user-loading').css('display', 'none');
        //出现吧猪角~
        for (var i = 0; i < this.thing.num; i++) {
            this.luckman.push(kalok.getLuckMan());
        }

        //逃不掉了，记起来
        localStorage.setItem(this.thing.id, JSON.stringify(this.luckman));

        //别以为清 localStorage 有用，还要往服务器扔的，嘿嘿嘿嘿嘿嘿嘿嘿
        // $.ajax({
        //     'url': 'http://ecd.ooxx.cn:3000/push?' + window.pushPar,
        //     'type': "POST",
        //     'data': {d: this.luckman, id: this.thing.id, title: this.thing.name, num: this.thing.num},
        //     'crossDomain': true,
        //     'dataType': 'json',
        //     'error': function (e) {
        //         console.log('服务器记录失败：' + e.repsonseText);
        //     },
        //     'success': function (data) {
        //         console.log('服务器记录成功：' + data);
        //     }
        // });

        //显示各位猪角
        this.showLuckman(300);
    },
    showLuckman: function (ms) {
        var _self = this;
        var $luckman = this.$el.find('.luckman');
        var num = $luckman.length; // 本轮中奖人数
        var index = 0;

        var show = function () {
            var item = $luckman[index];
            $(item).attr('data-rtx', _self.luckman[index].rtx);
            $(item).find('p').html(_self.luckman[index].rtx + "(" + _self.luckman[index].name + ")").hide().show();


            if (num >= 11) {
                $(item).css({ "width": "50%" });
                $(item).find('p').css("line-height", "44px");
            } else if (num >= 9 && num <= 10) {
                $(item).css({ "width": "100%" });
                $(item).find('p').css("line-height", "44px");
            } else if (num >= 5 && num <= 8) {
                $(item).css({ "width": "100%" });
                $(item).find('p').css("line-height", "52px");
            } else if (num == 4) {
                $(item).css({ "width": "50%", "margin-bottom": "18px" });
                $(item).find('p').css("line-height", "44px");
                $(item).find('img').attr('src', 'rtx/' + _self.luckman[index].rtx + ".png").hide().show();
            }
            // 3 需要特殊处理下 TODO
            else if (num == 3) {
                $(item).css({ "width": "50%", "margin-bottom": "18px" });
                $(item).find('p').css("line-height", "44px");
                $(item).find('img').attr('src', 'rtx/' + _self.luckman[index].rtx + ".png").hide().show();
            } else if (num == 2) {
                $(item).css({ "width": "50%" });
                $(item).find('p').css("line-height", "44px");
                $(item).find('img').attr('src', 'rtx/' + _self.luckman[index].rtx + ".png").hide().show();
            } else if (num == 1) {
                $(item).css({ "width": "100%" });
                $(item).find('p').css("line-height", "44px");
                $(item).find('img').attr('src', 'rtx/' + _self.luckman[index].rtx + ".png").hide().show();
            }

            index++;
        };

        show();
        var si = setInterval(function () {
            if (index >= $luckman.length) {
                clearInterval(si);
                console.log('clear si')
            } else {
                show();
            }
        }, ms);
    },
    changeLuckman: function (event) {
        var $el = $(event.currentTarget);

        //重新抽
        if ($el.attr('data-rtx') && confirm('真的要重抽吗？')) {
            var luckman = kalok.getLuckMan();

            $el.find('img').attr('src', 'rtx/' + luckman.rtx + ".png");
            $el.find('p').html(luckman.name + "<br>" + luckman.rtx + "").hide().show();

            var rtx = $el.attr('data-rtx');

            //写入 localstorage
            _.each(this.luckman, function (item, index) {
                if (item.rtx == rtx) {
                    this.luckman[index] = luckman;
                    localStorage.setItem(this.thing.id, JSON.stringify(this.luckman));
                    return;
                }
            }, this);

            //网络存储
            // $.ajax({
            //     'url': 'http://ecd.ooxx.cn:3000/update?' + window.pushPar,
            //     'type': "POST",
            //     'data': {d: this.luckman, id: this.thing.id, title: this.thing.name, num: this.thing.num},
            //     'dataType': 'json',
            //     'crossDomain': true,
            //     'error': function (e) {
            //         console.log('服务器更新记录失败：' + e.repsonseText);
            //     },
            //     'success': function (data) {
            //         console.log('服务器更新记录成功：' + data);
            //     }
            // });
        }
    },
    // override remove to also unbind events
    remove: function () {
        $(document).off('keyup', this.keyup);
        Backbone.View.prototype.remove.call(this);
    }
});

$(document).ready(function () {
    window.currentThingId = 0;

    // 模版加载
    kalok.templateLoader.load(['thing'], function () {
        kalok.router = new kalok.Router();
        Backbone.history.start();
    });
});