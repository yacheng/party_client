/**
 * app 主逻辑 by yacheng.sz @ 2012-12-15
*/
var app = {
    
    // 地图
    map: null,

    // 地图上的点
    mapPointList: [],

    // 时间
    time: '0', 

    // 请求地址
    http: 'http://10.12.45.18/',

    // 当前用户手机
    phone: '0',

    //当前用户名称
    nick: '',
    //头像

    picUrl:'',

    // 聚会id
    partyId: 0,

    cachePartyCreatorPhone:0,
    partyCreatorPhone:0,

    cachePartyId: 0,

    // 聚会中每个人的颜色
    pointColorArr: [
        '#332E81',
        '#AC2A23',
        '#D79E48',
        '#F46B20',
        '#EE332A',
        '#282A31',
        '#EED01B'
    ], 


    /**
     * 1、初始化功能组
    */
    // 登录
    init: function(){
        var self = this;

        // // 临时去掉登录功能
        // $('.J_Main').show();
        // self.initMain();

        // 录框
        $('.J_Login_Btn').click(function(){
            $.ajax({
                url: self.http + 'user',
                dataType:"jsonp",
                data: {
                    phone: $('#login-input1').val(), 
                    type: 4
                },
                jsonp:"callback",
                success:function(d){
                    console.log('yacheng login success');
                    if(d.isSuccess){
                        $('.J_Login').hide();
                        $('.J_Main').show();
                        self.phone = d.data.phone;
                        if(d.data.partyId) self.partyId = d.data.partyId;
                        if(d.data.nick) self.nick = d.data.nick;
                        if(d.data.picUrl) self.picUrl = d.data.picUrl;
                        self.initMain();
                    }else{
                        $('.J_Login').hide();
                        $('.J_Registered').show();
                    }
                },
                error:function(data){
                    console.log('yacheng login error');
                }
            });
        });

        // 注册
        $('.J_Registered_Btn').click(function(){
            $.ajax({
                url: self.http + 'user',
                dataType:"jsonp",
                data: {
                    phone: $('#login-input').val(), 
                    nick: $('#registered-input').val(), 
                    picUrl: '',
                    type: 5
                },
                jsonp:"callback",
                success:function(d){
                    console.log('yacheng login success');
                    if(d.isSuccess){
                        $('.J_Login').hide();
                        $('.J_Main').show();
                        self.initMain();
                        self.phone = d.data.phone;
                    }else{
                        $('.J_Login').hide();
                        $('.J_Registered').show();
                    }
                },
                error:function(data){
                    console.log('yacheng login error');
                }
            });
        });

    }, 
    // 登录后功能初始化
    initMain: function() {
        var self = this;
        
        $('.p-list').show();
            // TODO: 一会就删掉
//            $('#J_P_Main').fadeOut();
//            $('#J_P_Edit').fadeOut();
//            $('#J_P_Msg').fadeOut();
//            $('#J_P_Main').fadeOut();
//            $('.p-list').fadeOut();
//            $('#J_P_All_List').fadeIn();

        // 弹出通讯列表
        $('.J_P').click(function(){
            if($('.p-list').attr('data-open') == 1){
                $('.p-list').attr('data-open', '').removeClass('p-list-show').animate({'left': '100%'}, { duration: 500 });
                $('#J_Map').css({'z-index': '0'});
            }else{
                $('.p-list').attr('data-open', '1').addClass('p-list-show').animate({'left': '20%'}, { duration: 500 });
                $('#J_Map').css({'z-index': '-1'});
            }
        });

        // 弹出地图主页
        $('.J_B_Main').click(function(){
            $('#J_P_Edit').fadeOut();
            $('#J_P_Msg').fadeOut();
            $('#J_P_Main').fadeIn();
            $('.p-list').fadeIn();
        });

        // 弹出编辑页
        if(self.partyId <= 0 && self.partyCreatorPhone != self.phone){
            $('.J_B_Edit').hide();
        }
        $('.J_B_Edit').click(function(){
            $('#J_P_Msg').fadeOut();
            $('#J_P_Main').fadeOut();
            $('#J_P_Edit').fadeIn();
            $('.p-list').fadeOut();
            $('#J_P_All_List').fadeOut();


            //添加自己的头像到人列表

            var tmpl = '<li> ' +
                    '<div class="box"> ' +
                    '<img src="' + self.picUrl + '"/> ' +
                    '</div> ' +
                    '<span>'+self.nick+'</span> ' +
                    '</li>';
            $('.J_New_Person_Append_In_this_Box').html('').append(tmpl);


            if(self.phone) {
                $('#f-phoneList').val(self.phone);
            }


        });

        // 弹出群聊页
        $('.J_B_Msg').click(function(){
            $('#J_P_Edit').fadeOut();
            $('#J_P_Main').fadeOut();
            $('#J_P_Msg').fadeIn();
            $('.p-list').fadeOut();
            $('.p-list').attr('data-open', '').removeClass('p-list-show').animate({'left': '100%'}, { duration: 500 });
            $('#J_Map').css({'z-index': '0'});
        });

        // 拍照功能
        self.initCamera();

        // 设置屏幕高度
        $('.J_P_Content').height(document.body.clientHeight);
        $('#J_Map').height(document.body.clientHeight-100);
        $('.p-list').height(document.body.clientHeight);
        $('#J_P_Msg_List').height(document.body.clientHeight-132);


        // 地图设置
        $(document).ready(function(){
            self.initMap();
            // 轮循异步接口
            self.getData();
            var runInterval = setInterval(function() {
                self.getData();
            }, 10000);
        });

        // 发消息
        $('.J_Msg_Btn').click(function(){
            self.sendMsg();
        });

        // 编辑聚会
        $('.J_F_Btn').click(function(){
            self.editFrom();
        });

        // 接受邀请
        $('.J_A_Btn_Yes').click(function(){
            // console.log(self.cachePartyId);
            // console.log(self.partyId);
            self.partyId = self.cachePartyId;
            self.partyCreatorPhone = self.cachePartyCreatorPhone;
            self.sendInvited(3);
        });

        // 拒绝邀请
        $('.J_A_Btn_No').click(function(){
            self.cachePartyId = 0;
            self.sendInvited(6);
        });

        // 地点搜索
        $('.J_Search_Btn').click(function(){
            var str = $('.search-input').val();
            self.localSearch(str);
        });
        
        // 点击人的列表
        $('.J_PeopleListInParty').click(function(e){
            if($(e.target).hasClass('J_FindPeople')){
                var lng = $(e.target).attr('data-lng');
                var lat = $(e.target).attr('data-lat');
                if(lng != '0' && lat != '0'){
                    self.map.setCenter(new BMap.Point(lng, lat));
                    $('.p-list').attr('data-open', '').removeClass('p-list-show').animate({'left': '100%'}, { duration: 500 });
                    $('#J_Map').css({'z-index': '0'});
                }else{
                    alert('该用户还未找到');
                }
                
            }
        });

        // 我在创建聚会时的加号
        $('.J_Add_New_Person_In_Edit_Page').click(function(){
            // append 列表
            $.ajax({
                url: self.http + 'user',
                dataType:"jsonp",
                data: {
                        type: 2
                },
                jsonp:"callback",
                success:function(d){
                    if(d.isSuccess){
                        $('.p-all-list').html('');
                        var phoneList = $('#f-phoneList').val().split(',');
                        $.each(d.data, function(index, item){
                            var ifSame = false;
                            $.each(phoneList, function(i, t){
                                if(t == item.phone){
                                    ifSame = true;
                                }
                            });
                            if(!ifSame){
                                var str = '<li class="J_Add_One_Person" data-nick="'+item.nick+'" data-phone="'+item.phone+'" data-picUrl="'+item.picUrl+'">'+
                                  '<span class="left">'+item.nick+'</span><span class="green add right">添加</span>'+
                                '</li>';
                                $('.p-all-list').append(str);
                            }
                        });
                    }else{}
                    // 绑定事件
                    //J_Add_One_Person
                    $('.J_Add_One_Person').click(function(e) {
                        var target = e.target,
                            tmpl = '<li> ' +
                                '<div class="box"> ' +
                                '<img src="'+$(target).attr('data-picUrl')+'"/> ' +
                                '</div> ' +
                                '<span>'+$(target).attr('data-nick')+'</span> ' +
                                '</li>';
                        $('.J_New_Person_Append_In_this_Box').append(tmpl);

                        if($('#f-phoneList').val()) {
                            var val = $('#f-phoneList').val();
                            $('#f-phoneList').val(val + ',' + $(target).attr('data-phone'));
                        } else {
                            $('#f-phoneList').val($(target).attr('data-phone'));
                        }

                        $('#J_P_All_List').fadeOut();
                        $('#J_P_Edit').fadeIn();
                    });

                },
                error:function(data){
                }
            });

            $('#J_P_Msg').fadeOut();
            $('#J_P_All_List').fadeIn();


        })


    },


    // 显示某一页
    showOnePage: function(className){
        $('#J_P_Msg').fadeOut();
        $('#J_P_Main').fadeOut();
        $('#J_P_Edit').fadeOut();
        $('.p-list').fadeOut();
        $('#J_P_All_List').fadeOut();
        $(className).fadeIn();

    },




    /**
     * 2、消息处理
    */
    // 接受与拒绝邀请
    sendInvited: function(type){
        $.ajax({
            url: self.http + 'user',
            dataType:"jsonp",
            data: {
                    phone: self.phone, 
                    partyId: self.partyId, 
                    type: type
            },
            jsonp:"callback",
            success:function(d){
                alert('save ok');
                $('.J_Alert').hide();
            },
            error:function(data){
            }
        });
    }, 
    // 编辑表单
    editFrom: function(){
        var self = this;
        $.ajax({
            url: self.http + 'saveParty',
            dataType:"jsonp",
            data: {
                    name: $('#f-name').val(), 
                    creatorPhone: self.phone, 
                    target: $('#f-target').val(), 
                    position: $('#f-position').val(), 
                    partyDate: $('#f-partyDate').val(), 
                    phoneList: $('#f-phoneList').val()
            },
            jsonp:"callback",
            success:function(d){
                console.log('yacheng save party success');
                alert('save ok');
                self.partyId = d.data.partyId;
            },
            error:function(data){
            }
        });
    }, 
    // 发消息接口
    sendMsg: function(){
        self = this;
        $.ajax({
            url: self.http + 'message',
            dataType:"jsonp",
            data: {
                phone: self.phone,
                partyId: self.partyId,
                content: $('.msg-input').val()
            },
            jsonp:"callback",
            success:function(d){
                if(d.isSuccess){
                    self.time = d.data.gmtCreate;
                    $('#J_P_Msg_List').append('<li> <div  class="time">' +
                        '<span>'+ d.data.sendTime +'</span>' +
                        '</div> ' +
                        '<div class="container">' +
                        '<div class="tips-left"></div>'+
                        ' <div class="pic"> <div class="box"> <img src="'+ d.data.picUrl +'"/> </div> <span>'+ d.data.nick +'</span> ' +
                        '</div> ' +
                        '<div class="msg"> <p>'+  d.data.content +'</p> </div> </div>' +
                        ' </li>');
                }else{
                    alert('亲，你还没有群~');
                }
            },
            error:function(data){
            }
        });
    }, 
    // 轮循接口
    getData: function(){
        var self = this;
        $.ajax({
            url: self.http + 'cycle',
            dataType:"jsonp",
            data: {
                phone: self.phone,
                lastUpdateTime : self.time,
                partyId: self.partyId,
                latitude: self.lat,
                longitude: self.lng
            },
            jsonp:"callback",
            success:function(d){
                console.log('yacheng get data success ');
                if(d.isSuccess){
                    if(d.data.partyId){
                        self.partyId = d.data.partyId;
                    }
                    if(d.data.msgList && d.data.msgList.length){
                        self.setMsgList(d.data.msgList);
                    }
                    if(d.data.userList && d.data.userList.length){
                        self.setMap(d.data.userList); // 回写userlist
                    }
                    if(d.data.inviteMsg && d.data.inviteMsg.partyId){
                        self.cachePartyId = d.data.inviteMsg.partyId;
                        self.cachePartyCreatorPhone = d.data.partyCreatorPhone;
                        //alert('系统消息');
                        $('.J_Alert').show();
                        $('.J_A_Nick').html(d.data.inviteMsg.creator);
                        $('.J_A_PartName').html(d.data.inviteMsg.name);
                        $('.J_A_Time').html(d.data.inviteMsg.time);
                        $('.J_A_Place').html(d.data.inviteMsg.target);
                    }
                    // 写入人的列表和party信息
                    $('.J_PartyName1').html(d.data.partyName);
                    $('.J_PartyName2').html(d.data.partyName);
                    $('.J_PartyPeopleNum').html(d.data.userCount);
                    $('.J_NewMsgNum').html(d.data.msgCount);
                }
            },
            error:function(data){
                console.log('yacheng get data error');
            }
        });
    },
    // 回写消息列表
    setMsgList: function(list){
        self = this;
        for(var i = 0 ; i < list.length ; i++){
            var tmpl = '<li> <div  class="time">' +
                '<span>'+ list[i].sendTime +'</span>' +
                '</div> ' +
                '<div class="container">' +
                '<div class="tips-left"></div>'+
                ' <div class="pic"> <div class="box"> <img src="'+ list[i].picUrl +'"/> </div> <span>'+ list[i].nick +'</span> ' +
                '</div> ' +
                '<div class="msg"> <p>'+  list[i].content +'</p> </div> </div>' +
                ' </li>';
            $('#J_P_Msg_List').append(tmpl);
            if(i == list.length-1){
                self.time = list[i].sendTime;
            }
        }
    }, 







    /**
     * 3、地图
    */
    // 重绘地图
    setMap: function(list){
        var self = this;
        $('.J_PeopleListInParty').html('');
        // 清除覆盖物
        for(var i = 0 ; i < self.mapPointList.length ; i++){
            self.map.removeOverlay(self.mapPointList[i]);
        }
        if(list.length){
            // 重新绘制覆盖物
            for(var i = 0 ; i < list.length ; i++){
                var str = '<li class="J_FindPeople" data-lat="'+list[i].latitude+'" data-lng="'+list[i].longitude+'">'+
                  '<span class="p-color-point" style="background:'+self.pointColorArr[i]+'"></span>'+
                  '<img src="'+list[i].picUrl+'" />'+
                  '<span class="J_P_Name p-name">'+list[i].nick+'</span>'+
                '</li>';
                $('.J_PeopleListInParty').append(str);
                self.setMapOverLay(new BMap.Point(list[i].longitude, list[i].latitude), 20, self.pointColorArr[i]);
            }
        }
    }, 
    // 地图的位置获取
    initMap: function(){

        var self = this;

        // 默认进入杭州
        self.map = new BMap.Map('J_Map');
        var point = new BMap.Point(120.2, 30.3); // 杭州经纬度
        self.map.centerAndZoom(point, 11); 
        self.map.addControl(new BMap.NavigationControl({anchor: BMAP_ANCHOR_BOTTOM_RIGHT, type: BMAP_NAVIGATION_CONTROL_ZOOM}));  
        
        self.gc = new BMap.Geocoder(); 
        // 点 touchend
        self.map.addEventListener("click", function(e){
            // alert(e.point.lng + ", " + e.point.lat);
            var pt = e.point;
            // 弹出提示，询问是否创建约会
            self.gc.getLocation(pt, function(rs){
                var addComp = rs.addressComponents;
                $('.J_Map_Msg').html(addComp.province + addComp.city + addComp.district + addComp.street + addComp.streetNumber);
                if(confirm('当前地点'+addComp.province + addComp.city + addComp.district + addComp.street + addComp.streetNumber+'\n亲，是否创建约会？')){
                    $('#J_P_Msg').fadeOut();
                    $('#J_P_Main').fadeOut();
                    $('#J_P_Edit').fadeIn();
                    $('#f-target').val(addComp.province + addComp.city + addComp.district + addComp.street + addComp.streetNumber);
                    $('#f-position').val(e.point.lng + ", " + e.point.lat)
                }
            });
        });

        // 进入当前位置
        self.getPlace(function(a, b){
            var point = new BMap.Point(a, b);
            self.map.centerAndZoom(point, 15); 

            // 画圆型区域
            // self.circle = new BMap.Circle(point, 500);
            // self.mapPointList.push(self.circle);
            // self.map.addOverlay(self.circle);

            // 添加自定义覆盖物
            self.setMapOverLay(point, 20, '#000'); // 第三个参数是色值，比如#DDD
        }); 

    }, 
    // 自定义地图覆盖物
    setMapOverLay: function(center, length, color){
        if(!color){
            color = '';
        }
        var self = this;
        function SquareOverlay(center, length, color){  
           this._center = center;  
           this._length = length;  
           this._color = color;  
        }  
        // 继承API的BMap.Overlay  
        SquareOverlay.prototype = new BMap.Overlay();  
        SquareOverlay.prototype.initialize = function(map){  
            this._map = map; 
            var div = document.createElement("div");  
            div.style.position = "absolute"; 
            div.style.width = this._length + "px";  
            div.style.height = this._length + "px";  
            div.style.background = this._color;
            $(div).addClass('map-color-point');
            $(div).html('<span></span>');
            map.getPanes().markerPane.appendChild(div);    
            // 保存div实例  
            this._div = div;    
            return div;  
        }
        SquareOverlay.prototype.draw = function(){  
            var position = this._map.pointToOverlayPixel(this._center);  
            this._div.style.left = position.x - this._length / 2 + "px";  
            this._div.style.top = position.y - this._length / 2 + "px";  
            var self = this;
            this._div.addEventListener("click", function(){  
                // alert("点击标注");  
                var opts = {  
                     width : 100,     // 信息窗口宽度  
                     height: 50,     // 信息窗口高度  
                    }  
                    var infoWindow = new BMap.InfoWindow("party", opts);  // 创建信息窗口对象  
                    self._map.openInfoWindow(infoWindow, self._map.getCenter());      // 打开信息窗口 
            }); 
            this._div.addEventListener("touchend", function(){  
                // alert("点击标注");  
                var opts = {  
                     width : 100,     // 信息窗口宽度  
                     height: 50,     // 信息窗口高度  
                    }  
                    var infoWindow = new BMap.InfoWindow("party", opts);  // 创建信息窗口对象  
                    self._map.openInfoWindow(infoWindow, self._map.getCenter());      // 打开信息窗口 
            }); 
        }
        SquareOverlay.prototype.show = function(){  
            if (this._div){  
                this._div.style.display = "";  
            }  
        }
        SquareOverlay.prototype.hide = function(){  
            if (this._div){  
                this._div.style.display = "none";  
            }  
        }
        SquareOverlay.prototype.toggle = function(){  
            if (this._div){  
                if (this._div.style.display == ""){  
                    this.hide();  
                }  
                else {  
                    this.show();  
                }  
            }  
        }

        var mySquare = new SquareOverlay(center, length, color);
        self.mapPointList.push(mySquare);
        self.map.addOverlay(mySquare);

    }, 
    // 获取地理位置
    getPlace: function(callback){
        var self = this;
        navigator.geolocation.getCurrentPosition(function(position){
            var lat = position.coords.latitude; // 经度
            self.lat = lat;
            var lng = position.coords.longitude; // 纬度
            self.lng = lng;
            callback(lng, lat);
        },function(error){
            console.log('yacheng get place error : '+error);
            for(i in error){
                console.log(error[i]);
            }
        },{ 
            maximumAge: 3000, 
            timeout: 60000, 
            enableHighAccuracy: true
        });
    }, 
    // 地图搜索
    localSearch: function(str, point){
        var self = this;
        if(!self.local){
            self.local = new BMap.LocalSearch(self.map, {
                renderOptions:{map: self.map}
            });
        }else{
            self.local.clearResults();
        }
        if(str){
            self.local.search(str);
        }else{
            self.local.search(point);
        }
    }, 





    /**
     * 4、相机功能
    */
    // 初始化
    initCamera: function(){
        var self = this;
        $('.J_C').click(function(){
            self.getPic();
        });
    }, 
    // 使用摄像头拍照
    getPic: function(){
        navigator.camera.getPicture( function(imageData){
            alert(imageData);
            // $('.showImg').src('data:image/jpeg;base64,' + imageData);
        }, function(message){
            alert('error message : ' + message);
        }, { quality: 50 } );
    }, 






    /**
     * 5、录音功能
    */
    // 初始化
    initMedia: function(){
        var self = this;
        $('.J_S').click(function(){
            self.getMedia();
        });
    }, 
    // 获取设备
    getMedia: function(){
        var mediaRec = new Media('mytest.mp3', function(){
            console.log('success');
        }, function(){
            console.log('error');
        });
        // 录制音频
        mediaRec.startRecord();
        // 10秒钟后停止录制
        var recTime = 0;
        var recInterval = setInterval(function() {
            recTime = recTime + 1;
            setAudioPosition(recTime + " sec");
            if (recTime >= 10) {
                clearInterval(recInterval);
                mediaRec.stopRecord();
            }
        }, 1000);
    },
    // 设置音频播放位置（显示播放进度）
    setAudioPosition: function(position) {
        $('#audio_position').innerHTML = position;
    }


};
